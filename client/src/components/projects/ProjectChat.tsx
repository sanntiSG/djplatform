/**
 * ProjectChat — chat grupal interno de un proyecto.
 * Reutiliza MessageBubble, ChatInput y TypingIndicator del sistema de chat 1-a-1.
 * Solo visible para miembros activos del proyecto.
 */
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useAuthStore } from '../../store/useAuthStore.js'
import { ChatInput } from '../messages/ChatInput.js'
import { TypingIndicator } from '../messages/TypingIndicator.js'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import {
  useProjectMessages,
  useSendProjectMessage,
  useMarkProjectChatRead,
  useProjectChatSocket,
} from '../../hooks/useProjectChat.js'
import { getSocket } from '../../services/socket.js'
import type { ProjectMessageItem } from '../../services/projectChatService.js'
import { cn } from '../../utils/cn.js'

/* ── Message bubble adaptado para ProjectChat ─────────────────── */
function ProjectBubble({ msg, isOwn }: { msg: ProjectMessageItem; isOwn: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el,
      { opacity: 0, y: 10, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: isOwn ? EASE.pop : EASE.softOut, clearProps: 'transform' },
    )
  }, [isOwn])

  const time = new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn('flex flex-col gap-1 max-w-[78%] md:max-w-[62%]', isOwn ? 'items-end self-end' : 'items-start self-start')}>
      {/* Sender name (only for others) */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-1.5">
          {msg.senderAvatar ? (
            <img src={msg.senderAvatar} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-[var(--accent)]">
              {msg.senderName[0]?.toUpperCase()}
            </span>
          )}
          <span className="font-sans text-[10px] font-semibold text-[var(--text-muted)]">{msg.senderName}</span>
        </div>
      )}
      <div
        ref={ref}
        className={cn(
          'px-4 py-2.5 text-sm leading-relaxed',
          isOwn
            ? 'bg-[var(--accent)] text-[var(--bg)] rounded-[20px] rounded-br-[6px]'
            : 'bg-[var(--surface-elevated)] text-[var(--text)] rounded-[20px] rounded-bl-[6px] border border-white/5',
        )}
        style={{
          boxShadow: isOwn
            ? '0 2px 12px rgba(212,255,0,0.12), 0 1px 3px rgba(0,0,0,0.2)'
            : '0 1px 6px rgba(0,0,0,0.15)',
        }}
      >
        {msg.body}
      </div>
      <p className="font-sans text-[10px] text-[var(--text-muted)] px-1.5 tabular-nums opacity-70">{time}</p>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────── */
interface Props {
  projectId: string
}

export function ProjectChat({ projectId }: Props) {
  const { user } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingNames, setTypingNames] = useState<string[]>([])

  const { data, isLoading, fetchNextPage, hasNextPage } = useProjectMessages(projectId)
  const { mutate: send, isPending: sending } = useSendProjectMessage(projectId)
  const { mutate: markRead } = useMarkProjectChatRead(projectId)

  // Extraer pages (ultima página = mensajes más recientes)
  const allMessages: ProjectMessageItem[] = data?.pages.flatMap((p) => p.messages) ?? []
  const conversationId = data?.pages[0]?.conversationId ?? null

  // Socket
  useProjectChatSocket(projectId, conversationId)

  // Typing socket listeners
  useEffect(() => {
    const socket = getSocket()
    function onTypingStart({ userId }: { userId: string }) {
      if (userId === user?.id) return
      setIsTyping(true)
    }
    function onTypingStop({ userId }: { userId: string }) {
      if (userId === user?.id) return
      setIsTyping(false)
    }
    socket.on('project:typing:start', onTypingStart)
    socket.on('project:typing:stop', onTypingStop)
    return () => {
      socket.off('project:typing:start', onTypingStart)
      socket.off('project:typing:stop', onTypingStop)
    }
  }, [user?.id])

  // Marcar como leido al abrir
  useEffect(() => {
    markRead()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom y re-marcar leido cuando llegan mensajes nuevos
  // (limpia el badge en tiempo real mientras el chat esta visible)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
    if (allMessages.length > 0) markRead()
  }, [allMessages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend(body: string) {
    if (!body.trim()) return
    send({ body })
  }

  function handleTypingStart() {
    if (!conversationId) return
    getSocket().emit('project:typing:start', { conversationId })
  }

  function handleTypingStop() {
    if (!conversationId) return
    getSocket().emit('project:typing:stop', { conversationId })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 480,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Chat del equipo
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
            <span style={{ width: 20, height: 20, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {hasNextPage && !isLoading && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            style={{ alignSelf: 'center', fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '4px 12px', cursor: 'pointer', marginBottom: 8 }}
          >
            Ver mensajes anteriores
          </button>
        )}

        {!isLoading && allMessages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', opacity: 0.6 }}>
              Aun no hay mensajes. Se el primero en escribir.
            </p>
          </div>
        )}

        {allMessages.map((msg) => (
          <ProjectBubble
            key={msg._id}
            msg={msg}
            isOwn={msg.senderId === user?.id}
          />
        ))}

        {isTyping && (
          <div className="self-start">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  )
}
