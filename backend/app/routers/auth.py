"""Auth router — signup, login, refresh, verify email, password reset, Google OAuth."""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.database import get_db
from app.models.user import User, UserRole, EmailToken
from app.models.employer import Employer, Recruiter, JobSeeker
from app.schemas.auth import (
    SignupRequest, LoginRequest, TokenResponse,
    GoogleCallbackRequest, RoleSelectRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    MessageResponse, ResendVerificationRequest,
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, generate_email_token, hash_email_token,
)
from app.services.email_service import (
    email_service,
    verification_email_html,
    password_reset_email_html,
)
from app.config import settings
from app.middleware.auth import get_current_user_from_refresh

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

VERIFY_EXPIRE_HOURS = 24
RESET_EXPIRE_MINUTES = 15


# ── Helpers ───────────────────────────────────────────────────────────────────

def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/auth/refresh",
    )


def _create_profile(user: User, db_session) -> None:
    """Create the role-specific profile row right after user creation."""
    if user.role == UserRole.employer:
        db_session.add(Employer(user_id=user.id))
    elif user.role == UserRole.recruiter:
        db_session.add(Recruiter(user_id=user.id))
    elif user.role == UserRole.jobseeker:
        db_session.add(JobSeeker(user_id=user.id))


async def _send_verification(user: User, db: AsyncSession) -> None:
    raw_token, token_hash = generate_email_token()
    email_token = EmailToken(
        user_id=user.id,
        token_hash=token_hash,
        type="verify",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=VERIFY_EXPIRE_HOURS),
    )
    db.add(email_token)
    await db.flush()

    verify_url = f"{settings.FRONTEND_URL}/verify?token={raw_token}"
    await email_service.send_email(
        to=user.email,
        subject="Verify your Job Portal account",
        html=verification_email_html(user.name, verify_url),
    )


# ── Signup ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Block admin self-registration
    if body.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot register as admin")

    # Check duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
        is_verified=False,
    )
    db.add(user)
    await db.flush()          # get user.id without committing
    _create_profile(user, db)
    await _send_verification(user, db)
    await db.commit()

    return {"message": "Account created! Please check your email to verify your account."}


# ── Verify Email ──────────────────────────────────────────────────────────────

@router.get("/verify", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    token_hash = hash_email_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(EmailToken).where(
            EmailToken.token_hash == token_hash,
            EmailToken.type == "verify",
        )
    )
    email_token = result.scalar_one_or_none()

    if not email_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification link")
    if email_token.used_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link already used")
    if email_token.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link expired")

    # Activate user
    result2 = await db.execute(select(User).where(User.id == email_token.user_id))
    user = result2.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_verified = True
    email_token.used_at = now
    await db.commit()

    return {"message": "Email verified successfully! You can now log in."}


# ── Resend Verification ───────────────────────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(body: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if not user or user.is_verified:
        return {"message": "If your email is registered and unverified, you'll receive a new link."}

    await _send_verification(user, db)
    await db.commit()
    return {"message": "If your email is registered and unverified, you'll receive a new link."}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email first")

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=str(user.id),
        name=user.name,
        avatar_url=user.avatar_url,
    )


# ── Refresh Token ─────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    user: User = Depends(get_current_user_from_refresh),
):
    token_data = {"sub": str(user.id), "role": user.role.value}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(
        access_token=new_access,
        token_type="bearer",
        role=user.role,
        user_id=str(user.id),
        name=user.name,
        avatar_url=user.avatar_url,
    )


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/auth/refresh")
    return {"message": "Logged out successfully"}


# ── Forgot Password ───────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Always succeed — prevents email enumeration
    if not user or not user.is_verified:
        return {"message": "If this email is registered, you'll receive a password reset link."}

    raw_token, token_hash = generate_email_token()
    email_token = EmailToken(
        user_id=user.id,
        token_hash=token_hash,
        type="reset",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_EXPIRE_MINUTES),
    )
    db.add(email_token)
    await db.flush()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    await email_service.send_email(
        to=user.email,
        subject="Reset your Job Portal password",
        html=password_reset_email_html(user.name, reset_url),
    )
    await db.commit()
    return {"message": "If this email is registered, you'll receive a password reset link."}


# ── Reset Password ────────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_email_token(body.token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(EmailToken).where(
            EmailToken.token_hash == token_hash,
            EmailToken.type == "reset",
        )
    )
    email_token = result.scalar_one_or_none()

    if not email_token or email_token.used_at or email_token.expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    result2 = await db.execute(select(User).where(User.id == email_token.user_id))
    user = result2.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    email_token.used_at = now
    await db.commit()
    return {"message": "Password reset successfully! You can now log in."}


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.post("/google/callback")
async def google_callback(body: GoogleCallbackRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Exchange Google auth code for user info, then login or prompt role selection."""
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": body.code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google auth failed")

        google_tokens = token_resp.json()
        access_token_google = google_tokens.get("access_token")

        # Get user info
        user_resp = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token_google}"})
        if user_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch Google user info")

        google_user = user_resp.json()

    google_id = google_user.get("id")
    email = google_user.get("email")
    name = google_user.get("name", "")
    avatar_url = google_user.get("picture")

    # Check existing user by google_id or email
    result = await db.execute(
        select(User).where(
            (User.google_id == google_id) | (User.email == email)
        )
    )
    user = result.scalar_one_or_none()

    if user:
        # Link Google ID if not already linked (account merge)
        if not user.google_id:
            user.google_id = google_id
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        await db.commit()

        # Issue tokens and log in directly
        token_data = {"sub": str(user.id), "role": user.role.value}
        new_access = create_access_token(token_data)
        new_refresh = create_refresh_token(token_data)
        _set_refresh_cookie(response, new_refresh)

        return {
            "status": "login",
            "access_token": new_access,
            "token_type": "bearer",
            "role": user.role.value,
            "user_id": str(user.id),
            "name": user.name,
            "avatar_url": user.avatar_url,
        }
    else:
        # New user — return partial profile, frontend shows role selection
        return {
            "status": "role_selection",
            "google_id": google_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
        }


@router.post("/google/complete-signup", response_model=TokenResponse)
async def google_complete_signup(body: RoleSelectRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Called after role selection for new Google users."""
    if body.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot register as admin")

    # Check not already registered
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        avatar_url=body.avatar_url,
        google_id=body.google_id,
        role=body.role,
        is_verified=True,   # Google email = already verified
        password_hash=None,
    )
    db.add(user)
    await db.flush()
    _create_profile(user, db)
    await db.commit()

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=str(user.id),
        name=user.name,
        avatar_url=user.avatar_url,
    )
