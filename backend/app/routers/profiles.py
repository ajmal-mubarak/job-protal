"""Profiles router — view/update own profile, browse job seekers."""
import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import String
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.employer import Employer, Recruiter, JobSeeker
from app.middleware.auth import get_current_user, require_employer_or_recruiter

router = APIRouter(prefix="/profiles", tags=["profiles"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def compute_available(work_start: str | None, work_end: str | None) -> bool:
    """
    Returns True if the current UTC time falls within the seeker's working hours.
    work_start / work_end are "HH:MM" strings (local to the seeker — we treat as UTC
    for simplicity; a timezone field can be added later).
    Returns True if no hours are set (they haven’t configured it).
    """
    if not work_start or not work_end:
        return True   # No schedule set → show as available
    try:
        now = datetime.now(timezone.utc)
        cur  = now.hour * 60 + now.minute
        sh, sm = map(int, work_start.split(':'))
        eh, em = map(int, work_end.split(':'))
        start = sh * 60 + sm
        end   = eh * 60 + em
        if start <= end:
            return start <= cur <= end
        else:                     # overnight shift e.g. 22:00 – 06:00
            return cur >= start or cur <= end
    except Exception:
        return True


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
    work_start: Optional[str] = None
    work_end: Optional[str] = None
    is_currently_available: bool = True

    model_config = {"from_attributes": True}


class UpdateJobSeekerProfile(BaseModel):
    headline: Optional[str] = None
    skills: Optional[list[str]] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    is_open_to_work: Optional[bool] = None
    work_start: Optional[str] = None
    work_end: Optional[str] = None


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
            "work_start": profile.work_start,
            "work_end": profile.work_end,
            "is_currently_available": compute_available(profile.work_start, profile.work_end),
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
        allowed = {"headline", "skills", "location", "experience_years", "is_open_to_work", "resume_url", "work_start", "work_end"}
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
    open_to_work: Optional[bool] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Browse job seeker profiles — for employers and recruiters."""
    query = (
        select(JobSeeker, User)
        .join(User, User.id == JobSeeker.user_id)
        .where(User.is_active == True)
    )
    # Only filter by open_to_work if explicitly requested (True → open only, None → show all)
    if open_to_work is True:
        query = query.where(JobSeeker.is_open_to_work == True)
    if location:
        query = query.where(JobSeeker.location.ilike(f"%{location}%"))
    if skills:
        # Convert the ARRAY column to text and do a case-insensitive search
        skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        for skill in skill_list:
            # array_to_string converts ['Python','React'] → 'python,react' for ilike matching
            query = query.where(
                func.array_to_string(
                    cast(JobSeeker.skills, ARRAY(String)), ","
                ).ilike(f"%{skill}%")
            )
    query = query.limit(limit)

    results = await db.execute(query)
    rows = results.all()

    out = []
    for seeker, user in rows:
        available = compute_available(seeker.work_start, seeker.work_end)
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
            "work_start": seeker.work_start,
            "work_end": seeker.work_end,
            "is_currently_available": available,
        })
    return out


# ── Public Profile ─────────────────────────────────────────────────────────────

@router.get("/public/{user_id}")
async def get_public_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the public profile of any user."""
    u = await db.execute(select(User).where(User.id == user_id))
    user = u.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    base = {
        "user_id": str(user.id),
        "name": user.name,
        "avatar_url": user.avatar_url,
        "role": user.role.value,
        "is_verified": user.is_verified,
    }

    if user.role == UserRole.jobseeker:
        r = await db.execute(select(JobSeeker).where(JobSeeker.user_id == user_id))
        seeker = r.scalar_one_or_none()
        if seeker:
            base.update({
                "headline": seeker.headline,
                "resume_url": seeker.resume_url,
                "skills": seeker.skills or [],
                "location": seeker.location,
                "experience_years": seeker.experience_years,
                "is_open_to_work": seeker.is_open_to_work,
                "is_currently_available": compute_available(seeker.work_start, seeker.work_end),
            })
    elif user.role == UserRole.employer:
        r = await db.execute(select(Employer).where(Employer.user_id == user_id))
        employer = r.scalar_one_or_none()
        if employer:
            base.update({
                "company_name": employer.company_name,
                "company_logo_url": employer.company_logo_url,
                "company_description": employer.company_description,
                "website": employer.website,
                "is_premium": employer.is_premium,
            })
    elif user.role == UserRole.recruiter:
        r = await db.execute(select(Recruiter).where(Recruiter.user_id == user_id))
        recruiter = r.scalar_one_or_none()
        if recruiter:
            base.update({
                "agency_name": recruiter.agency_name,
                "bio": recruiter.bio,
                "is_premium": recruiter.is_premium,
                "is_verified_badge": recruiter.is_verified_badge,
            })

    return base
