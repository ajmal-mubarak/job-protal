"""Abstract EmailService + Resend implementation."""
import asyncio
import logging
import resend
from abc import ABC, abstractmethod
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService(ABC):
    @abstractmethod
    async def send_email(self, to: str, subject: str, html: str) -> None:
        pass


class ResendEmailService(EmailService):
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    async def send_email(self, to: str, subject: str, html: str) -> None:
        params: resend.Emails.SendParams = {
            "from": settings.FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        # Run blocking Resend HTTP call in thread pool to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(None, resend.Emails.send, params)
            logger.info(f"[EMAIL] Sent '{subject}' to {to} — id: {getattr(result, 'id', result)}")
        except Exception as exc:
            # ── DEV-MODE FALLBACK ────────────────────────────────────────────
            # Resend free plan only delivers to the account-owner's email.
            # In development, extract and print the link so you can use it manually.
            import re
            urls = re.findall(r'href="(https?://[^"]+)"', html)
            logger.error(
                f"\n{'='*60}\n"
                f"[EMAIL FAILED] Could not send to {to}\n"
                f"Reason: {exc}\n"
                f"{'─'*60}\n"
                f"⚠  Resend free plan: only delivers to the account owner's email.\n"
                f"   To send to any email, add & verify your domain at resend.com/domains\n"
                f"{'─'*60}\n"
                + (f"🔗 Verification/Reset URL (use this manually):\n   {urls[0]}\n" if urls else "")
                + f"{'='*60}"
            )
            if settings.APP_ENV == "production":
                raise  # In production, propagate the error


# ── Email Templates ───────────────────────────────────────────────────────────

def verification_email_html(name: str, verify_url: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                 background: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; 
                  border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                    padding: 40px 40px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
            Job Portal
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
            Your career journey starts here
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 12px;">
            Verify your email, {name} 👋
          </h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
            Thanks for signing up! Click the button below to verify your email address 
            and activate your account.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 0 0 32px;">
            <a href="{verify_url}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6);
                      color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;
                      padding: 16px 40px; border-radius: 12px; letter-spacing: 0.2px;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 8px;">
            This link expires in <strong>24 hours</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 40px; text-align: center; 
                    border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Job Portal · Built with ❤️
          </p>
        </div>
      </div>
    </body>
    </html>
    """


def password_reset_email_html(name: str, reset_url: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                 background: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; 
                  border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); 
                    padding: 40px 40px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            Password Reset
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1e293b; font-size: 22px; font-weight: 600; margin: 0 0 12px;">
            Hi {name},
          </h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
            We received a request to reset your password. Click the button below to 
            set a new password.
          </p>

          <div style="text-align: center; margin: 0 0 32px;">
            <a href="{reset_url}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444);
                      color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;
                      padding: 16px 40px; border-radius: 12px;">
              Reset Password
            </a>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #92400e; font-size: 13px; margin: 0;">
              ⚠️ This link expires in <strong>15 minutes</strong>.
            </p>
          </div>

          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
            If you didn't request a password reset, please ignore this email. 
            Your account is safe.
          </p>
        </div>
      </div>
    </body>
    </html>
    """


# ── Singleton ─────────────────────────────────────────────────────────────────
email_service: EmailService = ResendEmailService()
