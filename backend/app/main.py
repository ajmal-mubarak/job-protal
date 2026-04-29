"""FastAPI main entry point — app factory, startup, CORS, socket mount."""
import socketio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import create_tables
from app.utils.security import hash_password
from app.sockets.events import sio


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create all DB tables
    await create_tables()

    # 2. Seed admin user from .env
    await seed_admin()

    # 3. Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    yield  # ← app is running

    # Shutdown: nothing special needed (no Redis, no background workers)


async def seed_admin():
    """Create admin user from .env if not already in DB."""
    from app.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                name="Admin",
                role=UserRole.admin,
                is_verified=True,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            print(f"[OK] Admin seeded: {settings.ADMIN_EMAIL}")
        else:
            print(f"[INFO] Admin already exists: {settings.ADMIN_EMAIL}")


# ── App Factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="Job Portal API",
        description="FastAPI backend for Job Portal — JWT auth, real-time chat, AI scoring, Razorpay payments.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Allow both common Vite ports (5173 and 5174) in development
    cors_origins = [settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(set(cors_origins)),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    from app.routers import auth, jobs, applications, chat, notifications, payments, admin, upload, profiles
    app.include_router(auth.router)
    app.include_router(jobs.router)
    app.include_router(applications.router)
    app.include_router(chat.router)
    app.include_router(notifications.router)
    app.include_router(payments.router)
    app.include_router(admin.router)
    app.include_router(upload.router)
    app.include_router(profiles.router)

    # ── Static file serving (local uploads) ───────────────────────────────────
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "env": settings.APP_ENV}

    return app


# ── Mount Socket.io ───────────────────────────────────────────────────────────

fastapi_app = create_app()

# Wrap FastAPI with Socket.io ASGI app
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
