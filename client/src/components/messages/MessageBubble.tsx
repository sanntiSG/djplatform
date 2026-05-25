import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import type { MessageItem } from '../../services/conversationsService.js'
import { opportunityService } from '../../services/opportunityService.js'

interface Props {
  message: MessageItem
  isOwn: boolean
  isRead: boolean
  onReply?: (msg: MessageItem) => void
  replyMessage?: MessageItem | null
}

function OpportunityCard({ opportunityId, title, status, senderUserId, isOwn }: {
  opportunityId: string
  title: string
  status: 'open' | 'closed' | 'filled'
  senderUserId: string
  isOwn: boolean
}) {
  const qc = useQueryClient()
  const isClosed = status === 'closed' || status === 'filled'
  const acceptMutation = useMutation({
    mutationFn: () => opportunityService.acceptCollab(opportunityId, { collaboratorUserId: senderUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity', opportunityId] })
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['notification-inbox'] })
    },
  })

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden mb-2"
      style={{ background: 'var(--surface)' }}
    >
      <Link
        to={`/oportunidades/${opportunityId}`}
        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-medium text-[var(--text)] truncate">{title}</p>
          <p className="font-sans text-[10px] text-[var(--text-muted)]">
            {status === 'open' ? 'Disponible' : 'Cubierta'}
          </p>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
      {!isOwn && !isClosed && (
        <div className="px-3 pb-3">
          <button
            type="button"
            disabled={acceptMutation.isPending || acceptMutation.isSuccess}
            onClick={() => acceptMutation.mutate()}
            className="w-full py-1.5 rounded-lg font-sans text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              background: acceptMutation.isSuccess ? 'var(--accent-muted)' : 'var(--accent)',
              color: acceptMutation.isSuccess ? 'var(--accent)' : 'var(--bg)',
            }}
          >
            {acceptMutation.isSuccess ? 'Colaboracion aceptada' : acceptMutation.isPending ? '...' : 'Aceptar colaboracion'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReadTicks({ isOwn, isRead }: { isOwn: boolean; isRead: boolean }) {
  if (!isOwn) return null
  return (
    <span className={cn('flex items-center gap-[1px] transition-colors duration-300', isRead ? 'text-[var(--accent)]' : 'text-white/40')}>
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4l2.5 2.5L9 1" />
        {isRead && <path d="M4.5 4l2.5 2.5L12 1" />}
      </svg>
    </span>
  )
}

export function MessageBubble({ message, isOwn, isRead, onReply, replyMessage }: Props) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bubbleRef.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el,
      { opacity: 0, y: 14, scale: 0.94 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: DURATION.base,
        ease: isOwn ? EASE.pop : EASE.softOut,
        clearProps: 'transform',
      },
    )
  }, [isOwn])

  function handleSwipe() {
    const el = bubbleRef.current
    if (!el || prefersReducedMotion()) { onReply?.(message); return }
    gsap.timeline()
      .to(el, { x: isOwn ? -24 : 24, duration: 0.12, ease: EASE.out })
      .to(el, { x: 0, duration: 0.32, ease: `cubic-bezier(${EASE.iosSpring.join(',')})` })
      .call(() => onReply?.(message))
  }

  const time = new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      ref={wrapperRef}
      className={cn('flex flex-col gap-1 max-w-[80%] md:max-w-[65%]', isOwn ? 'items-end self-end' : 'items-start self-start')}
      onDoubleClick={handleSwipe}
    >
      {replyMessage && (
        <div className={cn(
          'text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-white/8 line-clamp-1 backdrop-blur-sm',
          isOwn ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-white/5 text-white/60',
        )}>
          <span className="opacity-60">↩</span> {replyMessage.body}
        </div>
      )}
      {message.attachment?.type === 'opportunity' && (
        <OpportunityCard
          opportunityId={message.attachment.opportunityId}
          title={message.attachment.title}
          status={message.attachment.status}
          senderUserId={message.senderId}
          isOwn={isOwn}
        />
      )}
      <div
        ref={bubbleRef}
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
        {message.body}
      </div>
      <div className="flex items-center gap-1.5 px-1.5">
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{time}</span>
        <ReadTicks isOwn={isOwn} isRead={isRead} />
      </div>
    </div>
  )
}
