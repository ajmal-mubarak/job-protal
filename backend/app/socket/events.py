"""Socket.io server — chat, presence, notifications."""
import socketio
from app.database import AsyncSessionLocal
from app.models.conversation import Message, Conversation
from app.models.user import User
from app.models.notification import Notification
from sqlalchemy import select, update
from datetime import datetime, timezone
import uuid

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",   # Tightened per-env via CORS middleware on FastAPI
    logger=False,
    engineio_logger=False,
)

# In-memory presence map: {user_id_str: sid}
# Note: single worker only (no Redis) — known v1 limitation
connected_users: dict[str, str] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _set_online_status(user_id: str, is_online: bool):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if user:
            if not is_online:
                # Store last_seen as updated_at (reusing existing field)
                user.updated_at = datetime.now(timezone.utc)
            await db.commit()


# ── Connection ────────────────────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    user_id = auth.get("user_id") if auth else None
    if not user_id:
        return False   # Reject unauthenticated connections

    connected_users[user_id] = sid
    await sio.enter_room(sid, f"user_{user_id}")
    await _set_online_status(user_id, True)

    # Broadcast online status to all connected clients
    await sio.emit("user_online", {"user_id": user_id})
    print(f"🟢 Connected: {user_id} (sid={sid})")


@sio.event
async def disconnect(sid):
    # Find which user disconnected
    user_id = next((uid for uid, s in connected_users.items() if s == sid), None)
    if user_id:
        del connected_users[user_id]
        await _set_online_status(user_id, False)
        await sio.emit("user_offline", {"user_id": user_id})
        print(f"🔴 Disconnected: {user_id}")


# ── Messaging ─────────────────────────────────────────────────────────────────

@sio.event
async def send_message(sid, data):
    """
    data: {
        conversation_id: str,
        sender_id: str,
        receiver_id: str,
        content: str
    }
    """
    conversation_id = data.get("conversation_id")
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    content = data.get("content", "").strip()

    if not all([conversation_id, sender_id, receiver_id, content]):
        await sio.emit("error", {"message": "Invalid message data"}, room=sid)
        return

    async with AsyncSessionLocal() as db:
        # Verify conversation exists
        result = await db.execute(
            select(Conversation).where(Conversation.id == uuid.UUID(conversation_id))
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            await sio.emit("error", {"message": "Conversation not found"}, room=sid)
            return

        # Save message to DB
        message = Message(
            conversation_id=uuid.UUID(conversation_id),
            sender_id=uuid.UUID(sender_id),
            content=content,
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

        message_data = {
            "id": str(message.id),
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "is_read": False,
            "created_at": message.created_at.isoformat(),
        }

    # Deliver to receiver if online
    receiver_sid = connected_users.get(receiver_id)
    if receiver_sid:
        await sio.emit("new_message", message_data, room=f"user_{receiver_id}")

    # Confirm to sender
    await sio.emit("message_sent", message_data, room=sid)


@sio.event
async def typing(sid, data):
    """data: { conversation_id, sender_id, receiver_id }"""
    receiver_id = data.get("receiver_id")
    if receiver_id:
        await sio.emit("user_typing", {
            "sender_id": data.get("sender_id"),
            "conversation_id": data.get("conversation_id"),
        }, room=f"user_{receiver_id}")


@sio.event
async def mark_read(sid, data):
    """data: { conversation_id, reader_id }"""
    conversation_id = data.get("conversation_id")
    reader_id = data.get("reader_id")
    if not conversation_id or not reader_id:
        return

    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Message)
            .where(
                Message.conversation_id == uuid.UUID(conversation_id),
                Message.sender_id != uuid.UUID(reader_id),
                Message.is_read == False,
            )
            .values(is_read=True)
        )
        await db.commit()

    await sio.emit("messages_read", {
        "conversation_id": conversation_id,
        "reader_id": reader_id,
    }, room=sid)
