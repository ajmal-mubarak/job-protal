"""Pydantic schemas for auth endpoints."""
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole
import re


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("name")
    @classmethod
    def valid_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    user_id: str
    name: str
    avatar_url: str | None = None


class MessageResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class GoogleCallbackRequest(BaseModel):
    code: str


class RoleSelectRequest(BaseModel):
    """Sent after Google OAuth role selection for new users."""
    google_id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None
    role: UserRole
