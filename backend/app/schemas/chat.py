"""Chat schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel


class StartConversationRequest(BaseModel):
    other_user_id: uuid.UUID


class ConversationResponse(BaseModel):
    id: uuid.UUID
    participant_1_id: uuid.UUID
    participant_2_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
