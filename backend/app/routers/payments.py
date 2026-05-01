"""Payments router — Razorpay order creation and verification."""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.payment import Payment, PaymentPurpose, PaymentStatus
from app.models.job import Job
from app.models.employer import Employer, Recruiter
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user
from app.services.payment_service import (
    create_order, verify_payment_signature,
    FEATURE_JOB_PRICE_INR, RECRUITER_SUB_PRICE_INR, EMPLOYER_SUB_PRICE_INR,
)
from app.schemas.payments import CreateOrderRequest, VerifyPaymentRequest, OrderResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/feature-job/{job_id}", response_model=OrderResponse)
async def feature_job_order(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if not job or str(job.posted_by_user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Job not found or not yours")

    order = create_order(
        amount_inr=FEATURE_JOB_PRICE_INR,
        receipt=f"feature_{job_id}",
        notes={"purpose": "feature_job", "job_id": str(job_id)},
    )
    payment = Payment(
        user_id=current_user.id,
        razorpay_order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        purpose=PaymentPurpose.feature_job,
        meta=str(job_id),
    )
    db.add(payment)
    await db.commit()
    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"],
            "key_id": __import__("app.config", fromlist=["settings"]).settings.RAZORPAY_KEY_ID}


@router.post("/subscribe", response_model=OrderResponse)
async def subscribe_order(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in {UserRole.recruiter, UserRole.employer}:
        raise HTTPException(status_code=403, detail="Only employers and recruiters can subscribe")

    price = RECRUITER_SUB_PRICE_INR if current_user.role == UserRole.recruiter else EMPLOYER_SUB_PRICE_INR
    purpose = PaymentPurpose.recruiter_subscription if current_user.role == UserRole.recruiter else PaymentPurpose.employer_subscription

    order = create_order(amount_inr=price, receipt=f"sub_{current_user.id}")
    payment = Payment(
        user_id=current_user.id,
        razorpay_order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        purpose=purpose,
    )
    db.add(payment)
    await db.commit()
    from app.config import settings
    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "key_id": settings.RAZORPAY_KEY_ID}


@router.post("/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # HMAC verify
    is_valid = verify_payment_signature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    payment = (await db.execute(
        select(Payment).where(Payment.razorpay_order_id == body.razorpay_order_id)
    )).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")

    payment.razorpay_payment_id = body.razorpay_payment_id
    payment.razorpay_signature = body.razorpay_signature
    payment.status = PaymentStatus.paid

    # Activate the purchased feature
    now = datetime.now(timezone.utc)
    if payment.purpose == PaymentPurpose.feature_job and payment.meta:
        job = (await db.execute(select(Job).where(Job.id == uuid.UUID(payment.meta)))).scalar_one_or_none()
        if job:
            job.is_featured = True

    elif payment.purpose in {PaymentPurpose.recruiter_subscription, PaymentPurpose.employer_subscription}:
        expires = now + timedelta(days=30)
        if current_user.role == UserRole.recruiter:
            profile = (await db.execute(select(Recruiter).where(Recruiter.user_id == current_user.id))).scalar_one_or_none()
            if profile:
                profile.is_verified_badge = True
        else:
            profile = (await db.execute(select(Employer).where(Employer.user_id == current_user.id))).scalar_one_or_none()
        
        if profile:
            profile.is_premium = True
            profile.premium_expires_at = expires

    await db.commit()
    return {"message": "Payment verified. Feature activated!", "status": "paid"}
