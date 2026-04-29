"""Upload router — resume and logo uploads."""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, UserRole
from app.models.employer import JobSeeker
from app.services import storage_service

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF resume. For job seekers, also stores the URL in their profile."""
    # Validate PDF
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    url = await storage_service.save_file(file, "resumes")

    # Persist to jobseeker profile so it auto-fills on applications
    if current_user.role == UserRole.jobseeker:
        r = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if not profile:
            profile = JobSeeker(user_id=current_user.id, resume_url=url)
            db.add(profile)
        else:
            profile.resume_url = url
        await db.commit()

    return {"url": url, "filename": file.filename}


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    url = await storage_service.save_file(file, "logos")
    return {"url": url, "filename": file.filename}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile photo — saves URL to users.avatar_url."""
    url = await storage_service.save_file(file, "avatars")
    current_user.avatar_url = url
    await db.commit()
    return {"url": url, "filename": file.filename}
