"""Admin schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.user import UserRole


class UserListResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUpdateUser(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    name: Optional[str] = None
