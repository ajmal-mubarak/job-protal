"""Chat router — conversation management and message history."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.database import get_db
from app.models.conversation import Conversation, Message
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user
from app.schemas.chat import ConversationResponse, MessageResponse, StartConversationRequest

router = APIRouter(prefix="/chat", tags=["chat"])
CHAT_ALLOWED = {UserRole.employer, UserRole.recruiter, UserRole.jobseeker}


def _check_perm(user: User):
    if user.role not in CHAT_ALLOWED:
        raise HTTPException(status_code=403, detail="Admins cannot use chat")


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def start_conversation(
    body: StartConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_perm(current_user)
    other = (await db.execute(select(User).where(User.id == body.other_user_id))).scalar_one_or_none()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    roles = {current_user.role, other.role}
    valid = [{UserRole.employer, UserRole.jobseeker}, {UserRole.recruiter, UserRole.jobseeker}]
    if roles not in valid:
        raise HTTPException(status_code=403, detail="Chat only allowed between Employer/Recruiter and Job Seekers")

    existing = (await db.execute(
        select(Conversation).where(or_(
            and_(Conversation.participant_1_id == current_user.id, Conversation.participant_2_id == body.other_user_id),
            and_(Conversation.participant_1_id == body.other_user_id, Conversation.participant_2_id == current_user.id),
        ))
    )).scalar_one_or_none()
    if existing:
        return existing

    conv = Conversation(participant_1_id=current_user.id, participant_2_id=body.other_user_id)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationResponse])
async def my_conversations(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _check_perm(current_user)
    result = await db.execute(
        select(Conversation).where(or_(
            Conversation.participant_1_id == current_user.id,
            Conversation.participant_2_id == current_user.id,
        )).order_by(Conversation.created_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_perm(current_user)
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if str(current_user.id) not in {str(conv.participant_1_id), str(conv.participant_2_id)}:
        raise HTTPException(status_code=403, detail="Not a participant")
    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    return result.scalars().all()
