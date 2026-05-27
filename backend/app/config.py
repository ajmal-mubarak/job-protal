from pydantic_settings import BaseSettings
from pydantic import EmailStr
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-this-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "https://jobprotal-kappa.vercel.app"
    BACKEND_URL: str = "https://job-protal-jbop.onrender.com"

    # Admin Seed
    ADMIN_EMAIL: str = "admin@jobportal.com"
    ADMIN_PASSWORD: str = "AdminPass123!"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/jobportal"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://jobprotal-kappa.vercel.app/auth/google/callback"

    # Resend
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "onboarding@resend.dev"

    # AI — Groq (primary, free & fast) + Gemini (legacy)
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
