import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import { useMessages, useSendMessage } from '../../hooks/useMessages.js'
import { useChatSocket, useTypingSocket } from '../../hooks/useChatSocket.js'
import { conversationsService } from '../../services/conversationsService.js'
import { getSocket } from '../../services/socket.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageBubble } from '../../components/messages/MessageBubble.js'
import { ChatInput } from '../../components/messages/ChatInput.js'
import { TypingIndicator } from '../../components/messages/TypingIndicator.js'
import { ReplyPreview } from '../../components/messages/ReplyPreview.js'
import type { MessageItem } from '../../services/conversationsService.js'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

function useOtherUser(conversationId: string) {
  return useQuery({
    queryKey: ['conversations'],
    select: (data: Awaited<ReturnType<typeof conversationsService.list>>) =>
      data.find(c => c._id === conversationId)?.otherUser ?? null,
  })
}

export default function Conversation() {
  const { id: conversationId = '' } = useParams()
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: pages, fetchNextPage, hasNextPage, isFetching } = useMessages(conversationId)
  const { mutate: sendMsg, isPending } = useSendMessage(conversationId)
  const { data: otherUser } = useOtherUser(conversationId)
  const { emitTypingStart, emitTypingStop } = useTypingSocket(conversationId)

  const [replyTo, setReplyTo] = useState<MessageItem | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollPill, setShowScrollPill] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const scrollPillRef = useRef<HTMLButtonElement>(null)

  // Register presence + socket listeners
  useChatSocket(conversationId)

  // Mark as read on mount
  useEffect(() => {
    conversationsService.markRead(conversationId).catch(() => { })
    qc.invalidateQueries({ queryKey: ['conversations'] })
    qc.invalidateQueries({ queryKey: ['conversations-unread'] })
  }, [conversationId, qc])

  // Listen for typing from other user
  useEffect(() => {
    const socket = getSocket()
    function onTypingStart({ userId: uid }: { userId: string }) {
      if (uid !== user?.id) setIsTyping(true)
    }
    function onTypingStop({ userId: uid }: { userId: string }) {
      if (uid !== user?.id) setIsTyping(false)
    }
    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)
    return () => {
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
    }
  }, [user?.id])

  // Scroll to bottom on new messages if already at bottom
  const messages = pages?.pages.flat() ?? []
  useEffect(() => {
    if (atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      animatePill(true)
    }
  }, [messages.length])

  function animatePill(show: boolean) {
    const el = scrollPillRef.current
    if (!el || prefersReducedMotion()) { setShowScrollPill(show); return }
    if (show) {
      setShowScrollPill(true)
      gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.softOut })
    } else {
      gsap.to(el, { opacity: 0, y: 8, duration: DURATION.micro, ease: EASE.softIn, onComplete: () => setShowScrollPill(false) })
    }
  }

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    atBottomRef.current = atBottom
    if (atBottom && showScrollPill) animatePill(false)

    // Load older messages when scrolled near the top
    if (el.scrollTop < 120 && hasNextPage && !isFetching) {
      void fetchNextPage()
    }
  }

  const handleSend = useCallback((body: string) => {
    sendMsg({ body, replyTo: replyTo?._id })
    setReplyTo(null)
    atBottomRef.current = true
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [sendMsg, replyTo])

  return (
    <main className="flex flex-col h-[calc(100dvh-var(--header-h,56px))]" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[var(--bg)]/95 backdrop-blur-md sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate('/me/mensajes')}
          className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Volver"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {otherUser ? (
          <Link
            to={otherUser.slug ? `/p/${otherUser.slug}` : '#'}
            className="flex items-center gap-2.5 flex-1 min-w-0 group"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--surface)] overflow-hidden">
              {otherUser.avatar
                ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xs font-display font-semibold text-[var(--text-muted)]">{otherUser.artistName.charAt(0)}</div>
              }
            </div>
            <span className="font-display font-semibold text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
              {otherUser.artistName}
            </span>
          </Link>
        ) : <div className="flex-1" />}
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2"
      >
        {isFetching && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.senderId === user?.id
          const isRead = msg.readBy.some(id => id !== user?.id)
          const replyMsg = msg.replyTo
            ? messages.find(m => m._id === msg.replyTo) ?? null
            : null
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={isOwn}
              isRead={isRead}
              onReply={setReplyTo}
              replyMessage={replyMsg}
            />
          )
        })}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll pill */}
      {showScrollPill && (
        <button
          ref={scrollPillRef}
          type="button"
          onClick={() => {
            atBottomRef.current = true
            animatePill(false)
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-[var(--surface-elevated)] text-[var(--text)] text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 shadow-xl"
        >
          Nuevos mensajes
        </button>
      )}

      {/* Composer */}
      <div className="shrink-0">
        {replyTo && <ReplyPreview message={replyTo} onClose={() => setReplyTo(null)} />}
        <ChatInput
          onSend={handleSend}
          disabled={isPending}
          onTypingStart={emitTypingStart}
          onTypingStop={emitTypingStop}
        />
      </div>
    </main>
  )
}
