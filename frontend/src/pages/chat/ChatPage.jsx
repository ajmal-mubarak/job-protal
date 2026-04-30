import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send, MessageSquare, Loader2, ChevronLeft, Search,
  Check, CheckCheck, ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import { chatApi } from '../../api/chat'
import useSocketStore from '../../store/useSocketStore'
import useAuthStore from '../../store/useAuthStore'
import { cn, timeAgo } from '../../lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function seenLabel(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 10)  return 'Seen just now'
  if (diff < 60)  return `Seen ${diff}s ago`
  if (diff < 3600) return `Seen ${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `Seen ${Math.floor(diff / 3600)} hr ago`
  return `Seen ${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`
}

// ── Avatar component ──────────────────────────────────────────────────────────

function AvatarCircle({ name, size = 'md', online = false }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const colors = [
    'from-indigo-500 to-purple-600', 'from-purple-500 to-pink-600',
    'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-600',
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0
  return (
    <div className="relative flex-shrink-0">
      <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white', sizeClasses[size], colors[colorIndex])}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-background rounded-full" />}
    </div>
  )
}

// ── Conversation List ─────────────────────────────────────────────────────────

function ConversationList({ conversations, activeId, onSelect, loading, mobileVisible, unreadMap }) {
  const { isUserOnline } = useSocketStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(conv => {
    const other = String(conv.participant_1_id) === String(user?.id)
      ? conv.participant_2_name : conv.participant_1_name
    return !search || other?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <aside className={cn(
      'flex flex-col bg-surface border-r border-border transition-all duration-300',
      'md:w-80 md:flex-shrink-0 md:relative md:translate-x-0',
      'absolute inset-0 z-20 w-full',
      mobileVisible ? 'flex' : 'hidden md:flex'
    )}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-text-primary">Messages</h2>
          <span className="text-xs font-medium px-2 py-1 bg-primary/15 text-primary-light rounded-full border border-primary/20">
            {conversations.length}
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={22} className="text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {search ? 'No results found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {search ? 'Try a different search' : 'Start chatting from a seeker profile'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isP1 = String(conv.participant_1_id) === String(user?.id)
            const other = isP1
              ? { id: conv.participant_2_id, name: conv.participant_2_name || 'User', avatar: conv.participant_2_avatar }
              : { id: conv.participant_1_id, name: conv.participant_1_name || 'User', avatar: conv.participant_1_avatar }
            const online = isUserOnline(String(other.id))
            const isActive = activeId === String(conv.id)
            const unread = unreadMap[String(conv.id)] || 0

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id, other)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150',
                  'hover:bg-surface-2 border-b border-border/50',
                  isActive && 'bg-primary/10 border-r-[3px] border-r-primary hover:bg-primary/10'
                )}
              >
                <AvatarCircle name={other.name} size="md" online={online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={cn('text-sm font-semibold truncate', isActive ? 'text-primary-light' : 'text-text-primary')}>
                      {other.name || 'User'}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {online && <span className="text-[10px] font-medium text-emerald-400">Online</span>}
                      {/* Unread badge — WhatsApp style */}
                      {unread > 0 && !isActive && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={cn('text-xs truncate', unread > 0 && !isActive ? 'text-text-primary font-medium' : 'text-text-muted')}>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

// ── Message Thread ─────────────────────────────────────────────────────────────

function MessageThread({ conversationId, otherUser, onBack, onRead }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [seenAt, setSeenAt] = useState(null)     // when other user read our messages
  const [atBottom, setAtBottom] = useState(true)  // is user scrolled to bottom
  const [newCount, setNewCount] = useState(0)      // messages arrived while scrolled up
  const [, setTick] = useState(0)                  // forces re-render for seenLabel time updates

  // Re-render every 30s so "Seen just now" → "Seen 1 min ago" etc.
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(timer)
  }, [])

  const { socket, isUserOnline } = useSocketStore()
  const { user } = useAuthStore()
  const scrollRef = useRef(null)   // the scrollable container
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeout = useRef(null)
  const isInitialLoad = useRef(true)

  const otherOnline = otherUser ? isUserOnline(String(otherUser.id)) : false

  // ── Load messages ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return
    isInitialLoad.current = true
    setLoading(true)
    setMessages([])
    setSeenAt(null)
    setNewCount(0)
    chatApi.getMessages(conversationId)
      .then((res) => {
        const msgs = res.data || []
        setMessages(msgs)
        // Mark all as read immediately
        if (socket) {
          socket.emit('mark_read', { conversation_id: conversationId, reader_id: user?.id })
        }
        onRead?.(String(conversationId))
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [conversationId])

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !conversationId) return
    const convId = String(conversationId).toLowerCase()

    const onMessageSent = (msg) => {
      if (String(msg.conversation_id).toLowerCase() !== convId) return
      setMessages((prev) => {
        const filtered = prev.filter(m => !String(m.id).startsWith('opt-'))
        if (filtered.some(m => m.id === msg.id)) return filtered
        return [...filtered, msg]
      })
    }

    const onNewMessage = (msg) => {
      if (String(msg.conversation_id).toLowerCase() !== convId) return
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      socket.emit('mark_read', { conversation_id: conversationId, reader_id: user?.id })
      onRead?.(String(conversationId))
      // If user is scrolled up, increment new message counter
      if (!atBottom) setNewCount(n => n + 1)
    }

    const onMessagesRead = (data) => {
      if (String(data.conversation_id).toLowerCase() !== convId) return
      const ts = data.read_at || new Date().toISOString()
      setSeenAt(ts)
      setMessages((prev) => prev.map(m => m.sender_id === user?.id ? { ...m, is_read: true } : m))
    }

    const onUserTyping = (data) => {
      if (String(data.conversation_id).toLowerCase() !== convId) return
      setIsTyping(true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setIsTyping(false), 2500)
    }

    socket.on('message_sent', onMessageSent)
    socket.on('new_message', onNewMessage)
    socket.on('messages_read', onMessagesRead)
    socket.on('user_typing', onUserTyping)
    return () => {
      socket.off('message_sent', onMessageSent)
      socket.off('new_message', onNewMessage)
      socket.off('messages_read', onMessagesRead)
      socket.off('user_typing', onUserTyping)
    }
  }, [socket, conversationId, user?.id, atBottom])

  // ── Smart scroll: only auto-scroll if user is at bottom ──────────────────
  useEffect(() => {
    if (loading) return
    if (isInitialLoad.current) {
      // Always jump to bottom on first load (no animation)
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      isInitialLoad.current = false
      return
    }
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // ── Scroll listener: track if user is at bottom ───────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAtBottom(isNearBottom)
    if (isNearBottom) setNewCount(0)
  }, [])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewCount(0)
    setAtBottom(true)
  }

  // ── Focus input ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (conversationId && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [conversationId, loading])

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!socket || !conversationId || !otherUser) return
    socket.emit('typing', {
      conversation_id: conversationId,
      sender_id: user?.id,
      receiver_id: otherUser.id,
    })
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!text.trim() || !socket || !conversationId) return
    const content = text.trim()
    setText('')
    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      sender_id: user?.id,
      conversation_id: conversationId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setAtBottom(true)
    socket.emit('send_message', {
      conversation_id: conversationId,
      sender_id: user?.id,
      receiver_id: otherUser?.id,
      content,
    })
  }

  // ── Find the last read message index (for "Seen" label) ──────────────────
  const myMessages = messages.filter(m => String(m.sender_id) === String(user?.id))
  const lastReadIdx = [...myMessages].reverse().findIndex(m => m.is_read)
  const lastReadId = lastReadIdx >= 0 ? myMessages[myMessages.length - 1 - lastReadIdx]?.id : null

  if (!conversationId) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-background">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <MessageSquare size={36} className="text-primary-light" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Your Messages</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Select a conversation from the left, or start a new one from a seeker profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-sm flex-shrink-0">
        <button onClick={onBack} className="md:hidden btn-icon" aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        {otherUser && (
          <>
            <AvatarCircle name={otherUser.name} size="md" online={otherOnline} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{otherUser.name}</p>
              <p className="text-xs text-text-muted">
                {isTyping ? (
                  <span className="text-primary-light animate-pulse">typing...</span>
                ) : otherOnline ? (
                  <span className="text-emerald-400">● Online</span>
                ) : 'Offline'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages area — relative so the FAB button is anchored here */}
      <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-4 flex flex-col gap-1.5 scroll-smooth scrollbar-thin"
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-3">
              <MessageSquare size={22} className="text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary">No messages yet</p>
            <p className="text-xs text-text-muted mt-1">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = String(msg.sender_id) === String(user?.id)
            const isOptimistic = String(msg.id).startsWith('opt-')
            const prevMsg = messages[idx - 1]
            const showAvatar = !isMine && (!prevMsg || String(prevMsg.sender_id) === String(user?.id))
            const isLastRead = msg.id === lastReadId && isMine

            return (
              <div key={msg.id}>
                <div className={cn('flex gap-2 items-end', isMine ? 'justify-end' : 'justify-start')}>
                  {/* Other user avatar — only on first consecutive message */}
                  {!isMine && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && <AvatarCircle name={otherUser?.name} size="sm" />}
                    </div>
                  )}

                  <div className="max-w-[72%] sm:max-w-[60%]">
                    <div className={cn(
                      'px-4 py-2.5 text-sm leading-relaxed break-words',
                      isMine
                        ? cn('bg-primary text-white shadow-glow-sm',
                            idx > 0 && String(messages[idx-1]?.sender_id) === String(user?.id)
                              ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-br-sm')
                        : 'bg-surface-2 text-text-primary border border-border rounded-2xl rounded-bl-sm',
                      isOptimistic && 'opacity-70'
                    )}>
                      {msg.content}
                    </div>

                    {/* Timestamp + read receipt */}
                    <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMine ? 'justify-end' : 'justify-start')}>
                      <p className="text-[10px] text-text-muted">{timeAgo(msg.created_at)}</p>
                      {isMine && (
                        isOptimistic
                          ? <Check size={11} className="text-text-muted/50" />
                          : msg.is_read
                            ? <CheckCheck size={11} className="text-primary-light" />
                            : <Check size={11} className="text-text-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* "Seen X ago" label under sender's last read message */}
                {isLastRead && seenAt && (
                  <p className="text-[10px] text-primary-light/70 text-right mt-0.5 pr-2 animate-in">
                    {seenLabel(seenAt)}
                  </p>
                )}
              </div>
            )
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-end">
            {otherUser && <div className="w-8"><AvatarCircle name={otherUser.name} size="sm" /></div>}
            <div className="bg-surface-2 border border-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom FAB — anchored inside the relative messages wrapper */}
      {!atBottom && (
        <div className="absolute bottom-4 right-4 z-10 animate-fab-in">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 bg-primary text-white rounded-full shadow-glow flex items-center justify-center hover:bg-primary-dark transition-all active:scale-95"
          >
            {newCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
            <ArrowDown size={16} />
          </button>
        </div>
      )}
      </div> {/* end relative wrapper */}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border bg-surface/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-2xl px-3 py-1.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <input
            id="chat-input"
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping() }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none py-1.5 min-w-0"
          />
          <button
            id="chat-send"
            onClick={handleSend}
            disabled={!text.trim() || !socket}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
              text.trim() && socket
                ? 'bg-primary text-white hover:bg-primary-dark shadow-glow-sm active:scale-95'
                : 'bg-surface-3 text-text-muted cursor-not-allowed'
            )}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted text-center mt-1.5">
          Press <kbd className="px-1 py-0.5 bg-surface-3 rounded text-[9px]">Enter</kbd> to send
        </p>
      </div>
    </div>
  )
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { conversationId: paramId } = useParams()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(paramId || null)
  const [activeOtherUser, setActiveOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showList, setShowList] = useState(!paramId)
  const [unreadMap, setUnreadMap] = useState({})   // { convId: count }
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { socket } = useSocketStore()

  // Load conversations
  useEffect(() => {
    chatApi.getConversations()
      .then((res) => {
        const convs = res.data || []
        setConversations(convs)

        if (paramId) {
          const conv = convs.find(c => String(c.id) === String(paramId))
          if (conv) {
            const isP1 = String(conv.participant_1_id) === String(user?.id)
            const other = isP1
              ? { id: conv.participant_2_id, name: conv.participant_2_name || 'User' }
              : { id: conv.participant_1_id, name: conv.participant_1_name || 'User' }
            setActiveOtherUser(other)
          }
        }
      })
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  // Listen for new messages to update unread counts and conversation preview
  useEffect(() => {
    if (!socket) return
    const onNewMessage = (msg) => {
      const convId = String(msg.conversation_id)
      // Update last_message preview in sidebar
      setConversations(prev =>
        prev.map(c => String(c.id) === convId
          ? { ...c, last_message: msg.content }
          : c
        )
      )
      // Increment unread count if not the active conversation
      if (convId !== activeId) {
        setUnreadMap(prev => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }))
      }
    }
    socket.on('new_message', onNewMessage)
    return () => socket.off('new_message', onNewMessage)
  }, [socket, activeId])

  // Clear unread when a conversation is read
  const handleRead = (convId) => {
    setUnreadMap(prev => {
      const next = { ...prev }
      delete next[convId]
      return next
    })
  }

  const handleSelect = (id, other) => {
    const strId = String(id)
    setActiveId(strId)
    setActiveOtherUser(other)
    setShowList(false)
    handleRead(strId)
    navigate(`/chat/${strId}`, { replace: true })
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={28} className="text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-muted">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelect}
              loading={false}
              mobileVisible={showList || !activeId}
              unreadMap={unreadMap}
            />
            <div className={cn('flex-1 flex flex-col min-w-0 relative', (showList && !activeId) ? 'hidden md:flex' : 'flex')}>
              <MessageThread
                conversationId={activeId}
                otherUser={activeOtherUser}
                onBack={() => setShowList(true)}
                onRead={handleRead}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
