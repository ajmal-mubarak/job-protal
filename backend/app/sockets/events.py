"""Socket.io server — chat, presence, notifications."""
import socketio
from app.database import AsyncSessionLocal
from app.models.conversation import Message, Conversation
from app.models.user import User
from app.models.notification import Notification
from sqlalchemy import select, update
from datetime import datetime, timezone
import uuid
from app.utils.security import decode_token

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# In-memory presence map: {user_id_str: sid}
connected_users: dict[str, str] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _set_online_status(user_id: str, is_online: bool):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if user:
            if not is_online:
                user.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def _save_and_emit_notification(receiver_id: str, notif_type: str, title: str, message: str, meta: dict | None = None):
    """Save a notification to DB AND emit via socket. Used by socket events (e.g. new chat message)."""
    async with AsyncSessionLocal() as db:
        notif = Notification(
            user_id=uuid.UUID(receiver_id),
            type=notif_type,
            title=title,
            message=message,
            meta=meta or {},
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        notif_data = {
            "id": str(notif.id),
            "type": notif.type,
            "title": notif.title,
            "message": notif.message,
            "is_read": False,
            "meta": notif.meta or {},
            "created_at": notif.created_at.isoformat(),
        }

    await sio.emit("new_notification", notif_data, room=f"user_{receiver_id}")
    return notif_data


# ── Connection ────────────────────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    token = auth.get("token") if auth else None
    user_id = None

    if token:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")

    if not user_id and auth:
        user_id = auth.get("user_id")

    if not user_id:
        return False

    connected_users[user_id] = sid
    await sio.enter_room(sid, f"user_{user_id}")
    await _set_online_status(user_id, True)
    await sio.emit("user_online", {"user_id": user_id})
    print(f"[SOCKET] Connected: {user_id} (sid={sid})")


@sio.event
async def disconnect(sid):
    user_id = next((uid for uid, s in connected_users.items() if s == sid), None)
    if user_id:
        del connected_users[user_id]
        await _set_online_status(user_id, False)
        await sio.emit("user_offline", {"user_id": user_id})
        print(f"[SOCKET] Disconnected: {user_id}")


# ── Messaging ─────────────────────────────────────────────────────────────────

@sio.event
async def send_message(sid, data):
    conversation_id = data.get("conversation_id")
    content = data.get("content", "").strip()

    if not conversation_id or not content:
        await sio.emit("error", {"message": "conversation_id and content are required"}, room=sid)
        return

    sender_id = next((uid for uid, s in connected_users.items() if s == sid), None)
    if not sender_id:
        sender_id = data.get("sender_id")
    if not sender_id:
        await sio.emit("error", {"message": "Could not identify sender"}, room=sid)
        return

    receiver_id = data.get("receiver_id") or None

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Conversation).where(Conversation.id == uuid.UUID(conversation_id))
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            await sio.emit("error", {"message": "Conversation not found"}, room=sid)
            return

        if not receiver_id:
            p1 = str(conversation.participant_1_id)
            p2 = str(conversation.participant_2_id)
            receiver_id = p2 if p1 == sender_id else p1

        # Fetch sender name for notification
        sender_user = (await db.execute(select(User).where(User.id == uuid.UUID(sender_id)))).scalar_one_or_none()
        sender_name = sender_user.name if sender_user else "Someone"

        message = Message(
            conversation_id=uuid.UUID(conversation_id),
            sender_id=uuid.UUID(sender_id),
            content=content,
        )
        db.add(message)
        conversation.last_message = content[:120]
        conversation.last_message_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(message)

        message_data = {
            "id": str(message.id),
            "conversation_id": str(conversation_id).lower(),
            "sender_id": str(sender_id).lower(),
            "content": content,
            "is_read": False,
            "created_at": message.created_at.isoformat(),
        }

    print(f"[MSG] {sender_id[:8]} → {receiver_id[:8] if receiver_id else '?'} | conv={conversation_id[:8]}")

    # Deliver message to receiver
    await sio.emit("new_message", message_data, room=f"user_{receiver_id}")

    # Push bell notification to receiver — saves to DB + emits via socket
    await _save_and_emit_notification(
        receiver_id=receiver_id,
        notif_type="new_message",
        title=f"New message from {sender_name}",
        message=content[:80] + ("…" if len(content) > 80 else ""),
        meta={"conversation_id": conversation_id, "sender_id": sender_id},
    )

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

    read_at = datetime.now(timezone.utc).isoformat()

    async with AsyncSessionLocal() as db:
        # Find sender(s) of the messages being marked read so we can notify them
        unread_msgs = (await db.execute(
            select(Message).where(
                Message.conversation_id == uuid.UUID(conversation_id),
                Message.sender_id != uuid.UUID(reader_id),
                Message.is_read == False,
            )
        )).scalars().all()

        sender_ids = list({str(m.sender_id) for m in unread_msgs})

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

    # Notify reader's side (to update UI)
    await sio.emit("messages_read", {
        "conversation_id": conversation_id,
        "reader_id": reader_id,
        "read_at": read_at,
    }, room=sid)

    # Also notify the original senders so they see "Seen" label
    for sender_id in sender_ids:
        if sender_id != reader_id:
            await sio.emit("messages_read", {
                "conversation_id": conversation_id,
                "reader_id": reader_id,
                "read_at": read_at,
            }, room=f"user_{sender_id}")


# ── External helper (used by REST routers to push notifications via socket) ───

async def push_notification(user_id: str, notif_id: str, notif_type: str, title: str, message: str, meta: dict | None = None):
    """
    Emit-ONLY socket push — NO DB write.
    REST routers that already saved their own Notification record call this
    to push it in real-time. Pass the DB record's id so the frontend can
    correlate and avoid duplicates.
    """
    notif_data = {
        "id": notif_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "is_read": False,
        "meta": meta or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await sio.emit("new_notification", notif_data, room=f"user_{user_id}")
