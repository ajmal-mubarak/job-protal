"""Razorpay payment service."""
import razorpay
import hmac
import hashlib
from app.config import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(amount_inr: float, receipt: str, notes: dict = None) -> dict:
    """
    Create a Razorpay order.
    amount_inr: amount in INR (will be converted to paise)
    Returns order dict with id, amount, currency
    """
    amount_paise = int(amount_inr * 100)
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "notes": notes or {},
    })
    return order


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    HMAC-SHA256 verification of Razorpay payment signature.
    Returns True if signature is valid.
    """
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


# ── Pricing ───────────────────────────────────────────────────────────────────
FEATURE_JOB_PRICE_INR = 99.0          # ₹99 to feature a job listing
RECRUITER_SUB_PRICE_INR = 499.0       # ₹499/month premium subscription
EMPLOYER_SUB_PRICE_INR = 299.0        # ₹299/month premium subscription
