import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, MessageSquare, Loader, ArrowLeft, Circle } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import { chatApi } from '../../api/chat'
import useSocketStore from '../../store/useSocketStore'
import useAuthStore from '../../store/useAuthStore'
import { cn, timeAgo } from '../../lib/utils'

function ConversationList({ conversations, activeId, onSelect }) {
  const { isUserOnline } = useSocketStore()
  const { user } = useAuthStore()

  return (
    <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-text-primary text-sm">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">No conversations yet</div>
        ) : (
          conversations.map((conv) => {
            const other = conv.participant_1_id === user?.id
              ? { id: conv.participant_2_id, name: conv.participant_2_name }
              : { id: conv.participant_1_id, name: conv.participant_1_name }
            const online = isUserOnline(other.id)

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 transition-colors',
                  activeId === conv.id && 'bg-primary/10 border-r-2 border-primary'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center text-sm font-semibold text-text-secondary">
                    {other.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{other.name || 'User'}</p>
                  <p className="text-xs text-text-muted truncate">{conv.last_message || 'No messages yet'}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function MessageThread({ conversationId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return
    setLoading(true)
    chatApi.getMessages(conversationId)
      .then((res) => setMessages(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [conversationId])

  // Real-time incoming messages
  useEffect(() => {
    if (!socket || !conversationId) return
    const handler = (msg) => {
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => [...prev, msg])
        socket.emit('message_read', { conversation_id: conversationId })
      }
    }
    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [socket, conversationId])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    setSending(true)

    if (socket) {
      socket.emit('send_message', { conversation_id: conversationId, content })
      // Optimistic update
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sender_id: user?.id,
        content,
        created_at: new Date().toISOString(),
        is_read: false,
      }])
    }
    setSending(false)
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Select a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader size={20} className="text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div>
                  <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                    {msg.content}
                  </div>
                  <p className={cn('text-[10px] text-text-muted mt-0.5', isMine ? 'text-right' : 'text-left')}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            type="text"
            placeholder="Type a message..."
            className="input flex-1"
          />
          <button
            id="chat-send"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="btn-primary px-4"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { conversationId: paramId } = useParams()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(paramId || null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chatApi.getConversations()
      .then((res) => setConversations(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (id) => {
    setActiveId(id)
    navigate(`/chat/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader size={24} className="text-primary animate-spin" />
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelect}
            />
            <MessageThread conversationId={activeId} />
          </>
        )}
      </div>
    </div>
  )
}
