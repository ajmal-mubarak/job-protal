"""Daily usage limiter for job posts and AI scoring."""
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.job import AIUsage, JobPostUsage
from app.models.user import User, UserRole
import uuid


FREE_JOB_LIMIT = 3
PREMIUM_JOB_LIMIT = 7
FREE_AI_LIMIT = 5
PREMIUM_AI_LIMIT = 20


def _today_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)


async def get_user_premium_status(user: User, db: AsyncSession = None) -> bool:
    """Returns True if user has active premium subscription.

    Uses explicit DB queries to avoid lazy-loading in async context (MissingGreenlet).
    Pass `db` from the request context; falls back to a new session if omitted.
    """
    from app.models.employer import Employer, Recruiter
    from sqlalchemy import select as _select

    now = datetime.now(timezone.utc)

    async def _check(db_session: AsyncSession) -> bool:
        if user.role == UserRole.employer:
            result = await db_session.execute(
                _select(Employer).where(Employer.user_id == user.id)
            )
            profile = result.scalar_one_or_none()
            if profile and profile.is_premium:
                return profile.premium_expires_at is None or profile.premium_expires_at > now
        elif user.role == UserRole.recruiter:
            result = await db_session.execute(
                _select(Recruiter).where(Recruiter.user_id == user.id)
            )
            profile = result.scalar_one_or_none()
            if profile and profile.is_premium:
                return profile.premium_expires_at is None or profile.premium_expires_at > now
        return False

    if db is not None:
        return await _check(db)

    # Fallback: open a fresh session (e.g. socket context)
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        return await _check(session)


async def check_job_post_limit(user_id: uuid.UUID, is_premium: bool, db: AsyncSession) -> tuple[bool, int, int]:
    """Returns (can_post, current_count, limit)."""
    today = _today_utc()
    result = await db.execute(
        select(JobPostUsage).where(
            JobPostUsage.user_id == user_id,
            JobPostUsage.date == today,
        )
    )
    usage = result.scalar_one_or_none()
    current_count = usage.count if usage else 0
    limit = PREMIUM_JOB_LIMIT if is_premium else FREE_JOB_LIMIT
    return current_count < limit, current_count, limit


async def increment_job_post_count(user_id: uuid.UUID, db: AsyncSession) -> None:
    today = _today_utc()
    result = await db.execute(
        select(JobPostUsage).where(
            JobPostUsage.user_id == user_id,
            JobPostUsage.date == today,
        )
    )
    usage = result.scalar_one_or_none()
    if usage:
        usage.count += 1
    else:
        db.add(JobPostUsage(user_id=user_id, date=today, count=1))


async def check_ai_usage_limit(user_id: uuid.UUID, is_premium: bool, db: AsyncSession) -> tuple[bool, int, int]:
    """Returns (can_use, current_count, limit)."""
    today = _today_utc()
    result = await db.execute(
        select(AIUsage).where(
            AIUsage.user_id == user_id,
            AIUsage.date == today,
        )
    )
    usage = result.scalar_one_or_none()
    current_count = usage.count if usage else 0
    limit = PREMIUM_AI_LIMIT if is_premium else FREE_AI_LIMIT
    return current_count < limit, current_count, limit


async def increment_ai_usage(user_id: uuid.UUID, db: AsyncSession) -> None:
    today = _today_utc()
    result = await db.execute(
        select(AIUsage).where(
            AIUsage.user_id == user_id,
            AIUsage.date == today,
        )
    )
    usage = result.scalar_one_or_none()
    if usage:
        usage.count += 1
    else:
        db.add(AIUsage(user_id=user_id, date=today, count=1))
