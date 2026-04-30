from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # Set to True temporarily only when debugging SQL queries
    pool_pre_ping=True,
    pool_size=5,         # Reduced for local dev (was 10)
    max_overflow=10,     # Reduced for local dev (was 20)
    connect_args={"server_settings": {"application_name": "job_portal"}},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        # Import all models so SQLAlchemy registers them before create_all
        import app.models.user       # noqa: F401
        import app.models.employer   # noqa: F401  (Employer, Recruiter, JobSeeker)
        import app.models.job        # noqa: F401  (Job, Application, AIUsage, JobPostUsage)
        import app.models.conversation  # noqa: F401
        import app.models.notification  # noqa: F401
        import app.models.payment    # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

