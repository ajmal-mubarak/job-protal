"""Payment schemas."""
from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    pass   # Specific params come from path/body per endpoint


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
