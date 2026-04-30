"""Applications router — apply, AI scoring, status updates."""
import uuid
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.job import Job, Application, ApplicationStatus
from app.models.employer import JobSeeker
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.middleware.auth import get_current_user, require_jobseeker, require_employer_or_recruiter
from app.services import storage_service
from app.services.ai_service import score_resume_against_job
from app.utils.limiter import check_ai_usage_limit, increment_ai_usage, get_user_premium_status
from app.schemas.applications import ApplicationResponse, ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


async def _enrich_application(app: Application, db: AsyncSession) -> dict:
    """Add applicant name, email and user_id to application data."""
    base = {
        "id": app.id,
        "job_id": app.job_id,
        "jobseeker_id": app.jobseeker_id,
        "resume_url": app.resume_url,
        "cover_letter": app.cover_letter,
        "status": app.status,
        "ai_score": app.ai_score,
        "ai_feedback": app.ai_feedback,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "applicant_user_id": None,
        "applicant_name": None,
        "applicant_email": None,
    }
    # Join JobSeeker → User to get name/email/user_id
    js = (await db.execute(select(JobSeeker).where(JobSeeker.id == app.jobseeker_id))).scalar_one_or_none()
    if js:
        user = (await db.execute(select(User).where(User.id == js.user_id))).scalar_one_or_none()
        if user:
            base["applicant_user_id"] = user.id
            base["applicant_name"] = user.name
            base["applicant_email"] = user.email
    return base



# ── Apply to Job ──────────────────────────────────────────────────────────────

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: uuid.UUID = Form(...),
    cover_letter: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_jobseeker),
    db: AsyncSession = Depends(get_db),
):
    # Get jobseeker profile
    js_result = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
    jobseeker = js_result.scalar_one_or_none()
    if not jobseeker:
        raise HTTPException(status_code=400, detail="Job seeker profile not found")

    # Verify job exists
    job_result = await db.execute(select(Job).where(Job.id == job_id, Job.is_active == True))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer active")

    # Prevent duplicate applications
    existing = await db.execute(
        select(Application).where(
            Application.job_id == job_id,
            Application.jobseeker_id == jobseeker.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You have already applied to this job")

    # Upload resume if provided
    resume_url = jobseeker.resume_url  # Use profile resume as fallback
    if resume and resume.filename:
        resume_url = await storage_service.save_file(resume, "resumes")

    application = Application(
        job_id=job_id,
        jobseeker_id=jobseeker.id,
        resume_url=resume_url,
        cover_letter=cover_letter,
        status=ApplicationStatus.applied,
    )
    db.add(application)

    # Notify the job poster
    notification = Notification(
        user_id=job.posted_by_user_id,
        type="new_application",
        title="New Application",
        message=f"{current_user.name} applied for {job.title}",
        meta={"job_id": str(job_id), "application_id": None},
    )
    db.add(notification)
    await db.commit()
    await db.refresh(application)

    # Update notification with application ID
    notification.meta["application_id"] = str(application.id)
    await db.commit()

    return application


# ── My Applications (Job Seeker) ──────────────────────────────────────────────

@router.get("/my", response_model=list[ApplicationResponse])
async def my_applications(
    current_user: User = Depends(require_jobseeker),
    db: AsyncSession = Depends(get_db),
):
    js_result = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
    jobseeker = js_result.scalar_one_or_none()
    if not jobseeker:
        return []

    result = await db.execute(
        select(Application).where(Application.jobseeker_id == jobseeker.id)
    )
    apps = result.scalars().all()
    return [await _enrich_application(a, db) for a in apps]


# ── Applications for a Job (Employer/Recruiter) ───────────────────────────────

@router.get("/job/{job_id}", response_model=list[ApplicationResponse])
async def job_applications(
    job_id: uuid.UUID,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    # Verify the job belongs to this user
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.posted_by_user_id) != str(current_user.id) and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(Application).where(Application.job_id == job_id))
    apps = result.scalars().all()
    # Enrich each application with applicant name/email/user_id
    return [await _enrich_application(a, db) for a in apps]


# ── Update Application Status ─────────────────────────────────────────────────

@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_status(
    application_id: uuid.UUID,
    body: ApplicationStatusUpdate,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify job ownership
    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()
    if not job or str(job.posted_by_user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    application.status = body.status

    # Build human-friendly status messages
    status_config = {
        "reviewing":   {"label": "is being reviewed 🔍",          "title": "Application Under Review"},
        "shortlisted": {"label": "has been shortlisted! 🎉",       "title": "You've Been Shortlisted! 🎉"},
        "rejected":    {"label": "was not selected this time",     "title": "Application Update"},
        "hired":       {"label": "has been accepted — You're hired! 🎊", "title": "Congratulations! You're Hired! 🎊"},
    }
    cfg = status_config.get(body.status.value, {"label": f"updated to {body.status.value}", "title": "Application Update"})

    # Notify jobseeker — save to DB + push via socket
    js_result = await db.execute(select(JobSeeker).where(JobSeeker.id == application.jobseeker_id))
    jobseeker = js_result.scalar_one_or_none()
    if jobseeker:
        notification = Notification(
            user_id=jobseeker.user_id,
            type="application_update",
            title=cfg["title"],
            message=f"Your application for '{job.title}' {cfg['label']}",
            meta={"job_id": str(job.id), "application_id": str(application_id), "status": body.status.value},
        )
        db.add(notification)
        await db.commit()
        await db.refresh(application)
        await db.refresh(notification)

        # Push real-time socket notification to jobseeker
        from app.sockets.events import push_notification
        try:
            await push_notification(
                user_id=str(jobseeker.user_id),
                notif_id=str(notification.id),
                notif_type="application_update",
                title=cfg["title"],
                message=f"Your application for '{job.title}' {cfg['label']}",
                meta={"job_id": str(job.id), "application_id": str(application_id), "status": body.status.value},
            )
        except Exception:
            pass  # Socket push failure should not break the REST response
    else:
        await db.commit()
        await db.refresh(application)

    return await _enrich_application(application, db)



# ── Withdraw Application ──────────────────────────────────────────────────────

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: uuid.UUID,
    current_user: User = Depends(require_jobseeker),
    db: AsyncSession = Depends(get_db),
):
    js_result = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
    jobseeker = js_result.scalar_one_or_none()

    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()

    if not application or not jobseeker or str(application.jobseeker_id) != str(jobseeker.id):
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status not in [ApplicationStatus.applied, ApplicationStatus.reviewing]:
        raise HTTPException(status_code=400, detail="Cannot withdraw after shortlisting")

    await db.delete(application)
    await db.commit()


# ── AI Score (On-Demand) ──────────────────────────────────────────────────────

@router.post("/{application_id}/ai-score", response_model=ApplicationResponse)
async def run_ai_score(
    application_id: uuid.UUID,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    is_premium = await get_user_premium_status(current_user, db)
    can_use, count, limit = await check_ai_usage_limit(current_user.id, is_premium, db)
    if not can_use:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily AI scoring limit reached ({limit}/day). Upgrade to premium for more.",
        )

    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()

    # Read resume text (basic — real impl would use pypdf2/pdfplumber)
    resume_text = f"Resume on file: {application.resume_url or 'not provided'}"

    ai_result = await score_resume_against_job(
        resume_text=resume_text,
        job_title=job.title,
        job_description=job.description,
        required_skills=job.skills_required or [],
    )

    application.ai_score = ai_result["score"]
    application.ai_feedback = str(ai_result)
    await increment_ai_usage(current_user.id, db)
    await db.commit()
    await db.refresh(application)
    return application
