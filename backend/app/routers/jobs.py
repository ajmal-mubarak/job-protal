"""Jobs router — CRUD, search/filter, featured logic, daily post limits."""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.job import Job, JobType, Application
from app.models.user import User, UserRole
from app.models.employer import Employer, Recruiter
from app.middleware.auth import get_current_user, require_employer_or_recruiter
from app.utils.limiter import (
    check_job_post_limit, increment_job_post_count, get_user_premium_status
)
from app.schemas.jobs import JobCreate, JobUpdate, JobResponse, JobListResponse, MyJobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])

FREE_DELAY_MINUTES = 3   # Free-tier jobs go live after 3 min (simulated moderation)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_poster_profile(user: User, db: AsyncSession):
    if user.role == UserRole.employer:
        r = await db.execute(select(Employer).where(Employer.user_id == user.id))
        return r.scalar_one_or_none()
    if user.role == UserRole.recruiter:
        r = await db.execute(select(Recruiter).where(Recruiter.user_id == user.id))
        return r.scalar_one_or_none()
    return None


# ── My Jobs (Employer/Recruiter) ──────────────────────────────────────────────
# NOTE: Must be defined BEFORE /{job_id} to avoid FastAPI matching "my" as a UUID

@router.get("/my/listings", response_model=list[MyJobResponse])
async def my_jobs(
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Job, func.count(Application.id).label('applicant_count'))
        .outerjoin(Application, Job.id == Application.job_id)
        .where(Job.posted_by_user_id == current_user.id)
        .group_by(Job.id)
        .order_by(desc(Job.created_at))
    )
    rows = result.all()
    
    # Map each (Job, count) to MyJobResponse dictionary
    jobs_with_counts = []
    for job, count in rows:
        job_data = MyJobResponse.model_validate(job).model_dump()
        job_data["applicant_count"] = count
        jobs_with_counts.append(job_data)
        
    return jobs_with_counts


# ── Get Single Job ────────────────────────────────────────────────────────────

@router.get("", response_model=JobListResponse)
async def list_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[JobType] = Query(None),
    min_salary: Optional[int] = Query(None),
    max_salary: Optional[int] = Query(None),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    featured_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    filters = [
        Job.is_active == True,
        Job.goes_live_at <= now,
        or_(Job.expires_at == None, Job.expires_at > now),
    ]

    if search:
        filters.append(or_(
            Job.title.ilike(f"%{search}%"),
            Job.description.ilike(f"%{search}%"),
            Job.company_name.ilike(f"%{search}%"),
        ))
    if location:
        filters.append(Job.location.ilike(f"%{location}%"))
    if job_type:
        filters.append(Job.job_type == job_type)
    if min_salary is not None:
        filters.append(Job.salary_min >= min_salary)
    if max_salary is not None:
        filters.append(Job.salary_max <= max_salary)
    if featured_only:
        filters.append(Job.is_featured == True)
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            filters.append(Job.skills_required.any(skill))

    offset = (page - 1) * limit
    # Featured jobs first, then newest
    result = await db.execute(
        select(Job)
        .where(and_(*filters))
        .order_by(desc(Job.is_featured), desc(Job.created_at))
        .offset(offset)
        .limit(limit)
    )
    jobs = result.scalars().all()
    return {"jobs": jobs, "page": page, "limit": limit, "count": len(jobs)}


@router.get("/featured", response_model=list[JobResponse])
async def featured_jobs(limit: int = Query(6, ge=1, le=20), db: AsyncSession = Depends(get_db)):
    """Homepage featured jobs section."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Job)
        .where(
            Job.is_featured == True,
            Job.is_active == True,
            Job.goes_live_at <= now,
            or_(Job.expires_at == None, Job.expires_at > now),
        )
        .order_by(desc(Job.created_at))
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Increment view count
    job.views += 1
    await db.commit()
    await db.refresh(job)
    return job


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    body: JobCreate,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_poster_profile(current_user, db)
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    is_premium = await get_user_premium_status(current_user, db)
    can_post, count, limit = await check_job_post_limit(current_user.id, is_premium, db)
    if not can_post:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily job post limit reached ({limit}/day). Upgrade to premium for more posts.",
        )

    # Premium = instant live, Free = 3-min delay
    goes_live_at = datetime.now(timezone.utc)
    if not is_premium:
        goes_live_at += timedelta(minutes=FREE_DELAY_MINUTES)

    # Auto-fill company info from employer profile if available
    company_name = body.company_name
    company_logo_url = body.company_logo_url
    if current_user.role == UserRole.employer and hasattr(profile, "company_name"):
        company_name = company_name or profile.company_name
        company_logo_url = company_logo_url or profile.company_logo_url

    job = Job(
        posted_by_user_id=current_user.id,
        employer_id=profile.id if current_user.role == UserRole.employer else None,
        recruiter_id=profile.id if current_user.role == UserRole.recruiter else None,
        company_name=company_name,
        company_logo_url=company_logo_url,
        title=body.title,
        description=body.description,
        location=body.location,
        job_type=body.job_type,
        salary_min=body.salary_min,
        salary_max=body.salary_max,
        skills_required=body.skills_required,
        goes_live_at=goes_live_at,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(job)
    await increment_job_post_count(current_user.id, db)
    await db.commit()
    await db.refresh(job)
    return job


# ── Update ────────────────────────────────────────────────────────────────────

@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    body: JobUpdate,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.posted_by_user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your job listing")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    await db.commit()
    await db.refresh(job)
    return job


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Allow owner or admin
    if str(job.posted_by_user_id) != str(current_user.id) and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(job)
    await db.commit()


# (my_jobs moved above get_job — see top of 'Get Single Job' section)
