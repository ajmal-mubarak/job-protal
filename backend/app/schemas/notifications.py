"""Notification schemas."""
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    is_read: bool
    meta: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
