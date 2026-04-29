"""Profiles router — view/update own profile, browse job seekers."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.employer import Employer, Recruiter, JobSeeker
from app.middleware.auth import get_current_user, require_employer_or_recruiter

router = APIRouter(prefix="/profiles", tags=["profiles"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class JobSeekerProfileOut(BaseModel):
    user_id: uuid.UUID
    name: str
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    resume_url: Optional[str] = None
    skills: list[str] = []
    location: Optional[str] = None
    experience_years: int = 0
    is_open_to_work: bool = True

    model_config = {"from_attributes": True}


class UpdateJobSeekerProfile(BaseModel):
    headline: Optional[str] = None
    skills: Optional[list[str]] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    is_open_to_work: Optional[bool] = None


class UpdateEmployerProfile(BaseModel):
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    website: Optional[str] = None


class UpdateRecruiterProfile(BaseModel):
    agency_name: Optional[str] = None
    bio: Optional[str] = None


# ── GET own profile ───────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the current user's profile (role-specific fields included)."""
    base = {
        "user_id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "is_verified": current_user.is_verified,
    }

    if current_user.role == UserRole.jobseeker:
        r = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if not profile:
            # Auto-create profile on first access
            profile = JobSeeker(user_id=current_user.id)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
        base.update({
            "headline": profile.headline,
            "resume_url": profile.resume_url,
            "skills": profile.skills or [],
            "location": profile.location,
            "experience_years": profile.experience_years,
            "is_open_to_work": profile.is_open_to_work,
        })

    elif current_user.role == UserRole.employer:
        r = await db.execute(select(Employer).where(Employer.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if profile:
            base.update({
                "company_name": profile.company_name,
                "company_description": profile.company_description,
                "website": profile.website,
                "company_logo_url": profile.company_logo_url,
                "is_premium": profile.is_premium,
            })

    elif current_user.role == UserRole.recruiter:
        r = await db.execute(select(Recruiter).where(Recruiter.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if profile:
            base.update({
                "agency_name": profile.agency_name,
                "bio": profile.bio,
                "is_premium": profile.is_premium,
                "is_verified_badge": profile.is_verified_badge,
            })

    return base


# ── PATCH own profile ─────────────────────────────────────────────────────────

@router.patch("/me")
async def update_my_profile(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's name and/or role-specific profile fields."""
    # Always allow name update
    if "name" in body and body["name"]:
        current_user.name = body["name"]

    if current_user.role == UserRole.jobseeker:
        r = await db.execute(select(JobSeeker).where(JobSeeker.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if not profile:
            profile = JobSeeker(user_id=current_user.id)
            db.add(profile)
        allowed = {"headline", "skills", "location", "experience_years", "is_open_to_work", "resume_url"}
        for k, v in body.items():
            if k in allowed and v is not None:
                setattr(profile, k, v)

    elif current_user.role == UserRole.employer:
        r = await db.execute(select(Employer).where(Employer.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if profile:
            allowed = {"company_name", "company_description", "website"}
            for k, v in body.items():
                if k in allowed and v is not None:
                    setattr(profile, k, v)

    elif current_user.role == UserRole.recruiter:
        r = await db.execute(select(Recruiter).where(Recruiter.user_id == current_user.id))
        profile = r.scalar_one_or_none()
        if profile:
            allowed = {"agency_name", "bio"}
            for k, v in body.items():
                if k in allowed and v is not None:
                    setattr(profile, k, v)

    await db.commit()
    return {"message": "Profile updated"}


# ── Browse Job Seekers (employer/recruiter only) ───────────────────────────────

@router.get("/seekers", response_model=list[JobSeekerProfileOut])
async def list_seekers(
    skills: Optional[str] = None,
    location: Optional[str] = None,
    open_to_work: bool = True,
    limit: int = 30,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    """Browse job seeker profiles — for employers and recruiters."""
    query = (
        select(JobSeeker, User)
        .join(User, User.id == JobSeeker.user_id)
        .where(User.is_active == True)
    )
    if open_to_work:
        query = query.where(JobSeeker.is_open_to_work == True)
    if location:
        query = query.where(JobSeeker.location.ilike(f"%{location}%"))
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            query = query.where(JobSeeker.skills.any(skill))
    query = query.limit(limit)

    results = await db.execute(query)
    rows = results.all()

    out = []
    for seeker, user in rows:
        out.append({
            "user_id": str(user.id),
            "name": user.name,
            "avatar_url": user.avatar_url,
            "headline": seeker.headline,
            "resume_url": seeker.resume_url,
            "skills": seeker.skills or [],
            "location": seeker.location,
            "experience_years": seeker.experience_years,
            "is_open_to_work": seeker.is_open_to_work,
        })
    return out


# ── Public seeker profile ─────────────────────────────────────────────────────

@router.get("/seekers/{user_id}", response_model=JobSeekerProfileOut)
async def get_seeker_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(require_employer_or_recruiter),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(JobSeeker).where(JobSeeker.user_id == user_id))
    seeker = r.scalar_one_or_none()
    if not seeker:
        raise HTTPException(status_code=404, detail="Seeker not found")
    u = await db.execute(select(User).where(User.id == user_id))
    user = u.scalar_one_or_none()
    return {
        "user_id": str(user.id),
        "name": user.name,
        "avatar_url": user.avatar_url,
        "headline": seeker.headline,
        "resume_url": seeker.resume_url,
        "skills": seeker.skills or [],
        "location": seeker.location,
        "experience_years": seeker.experience_years,
        "is_open_to_work": seeker.is_open_to_work,
    }
