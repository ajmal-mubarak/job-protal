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


def _enrich_conv(conv: Conversation, u1: User | None, u2: User | None) -> dict:
    """Build a ConversationResponse-compatible dict with names populated."""
    return {
        "id": conv.id,
        "participant_1_id": conv.participant_1_id,
        "participant_2_id": conv.participant_2_id,
        "participant_1_name": u1.name if u1 else None,
        "participant_2_name": u2.name if u2 else None,
        "participant_1_avatar": u1.avatar_url if u1 else None,
        "participant_2_avatar": u2.avatar_url if u2 else None,
        "last_message": getattr(conv, "last_message", None),
        "created_at": conv.created_at,
    }


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
        # Fetch both users
        u1 = (await db.execute(select(User).where(User.id == existing.participant_1_id))).scalar_one_or_none()
        u2 = (await db.execute(select(User).where(User.id == existing.participant_2_id))).scalar_one_or_none()
        return _enrich_conv(existing, u1, u2)

    conv = Conversation(participant_1_id=current_user.id, participant_2_id=body.other_user_id)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    # current_user is participant_1, other is participant_2
    return _enrich_conv(conv, current_user, other)


@router.get("/conversations", response_model=list[ConversationResponse])
async def my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_perm(current_user)
    result = await db.execute(
        select(Conversation).where(or_(
            Conversation.participant_1_id == current_user.id,
            Conversation.participant_2_id == current_user.id,
        )).order_by(Conversation.created_at.desc())
    )
    convs = result.scalars().all()

    # Batch-load all unique user IDs
    user_ids = set()
    for c in convs:
        user_ids.add(c.participant_1_id)
        user_ids.add(c.participant_2_id)

    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_map: dict[uuid.UUID, User] = {u.id: u for u in users_result.scalars().all()}

    return [
        _enrich_conv(c, users_map.get(c.participant_1_id), users_map.get(c.participant_2_id))
        for c in convs
    ]


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
