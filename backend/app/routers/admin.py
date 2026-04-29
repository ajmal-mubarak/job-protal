"""Admin router — user management, reports."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job, Application
from app.middleware.auth import require_roles
from app.schemas.admin import UserListResponse, AdminUpdateUser

router = APIRouter(prefix="/admin", tags=["admin"])
require_admin = require_roles(UserRole.admin)


@router.get("/users", response_model=list[UserListResponse])
async def list_users(
    role: UserRole | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if role:
        filters.append(User.role == role)
    if search:
        from sqlalchemy import or_
        filters.append(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))

    from sqlalchemy import and_
    q = select(User).order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    if filters:
        q = q.where(and_(*filters))
    return (await db.execute(q)).scalars().all()


@router.patch("/users/{user_id}", response_model=UserListResponse)
async def update_user(
    user_id: uuid.UUID,
    body: AdminUpdateUser,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot modify another admin")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete admin")
    await db.delete(user)
    await db.commit()


@router.get("/reports/summary")
async def summary_report(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar()
    total_applications = (await db.execute(select(func.count(Application.id)))).scalar()
    active_jobs = (await db.execute(select(func.count(Job.id)).where(Job.is_active == True))).scalar()
    featured_jobs = (await db.execute(select(func.count(Job.id)).where(Job.is_featured == True))).scalar()

    role_counts = {}
    for role in UserRole:
        count = (await db.execute(select(func.count(User.id)).where(User.role == role))).scalar()
        role_counts[role.value] = count

    return {
        "total_users": total_users,
        "users_by_role": role_counts,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "featured_jobs": featured_jobs,
        "total_applications": total_applications,
    }


@router.delete("/jobs/{job_id}", status_code=204)
async def admin_delete_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
