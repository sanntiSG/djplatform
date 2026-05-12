import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import type { MessageItem } from '../../services/conversationsService.js'

interface Props {
  message: MessageItem
  isOwn: boolean
  isRead: boolean
  onReply?: (msg: MessageItem) => void
  replyMessage?: MessageItem | null
}

function ReadTicks({ isOwn, isRead }: { isOwn: boolean; isRead: boolean }) {
  if (!isOwn) return null
  return (
    <span className={cn('flex items-center gap-[1px]', isRead ? 'text-[var(--accent)]' : 'text-white/40')}>
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4l2.5 2.5L9 1" />
        {isRead && <path d="M4.5 4l2.5 2.5L12 1" />}
      </svg>
    </span>
  )
}

export function MessageBubble({ message, isOwn, isRead, onReply, replyMessage }: Props) {
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bubbleRef.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el,
      { opacity: 0, y: 10, scale: isOwn ? 0.96 : 1 },
      { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: isOwn ? EASE.pop : EASE.softOut },
    )
  }, [isOwn])

  function handleSwipe() {
    const el = bubbleRef.current
    if (!el || prefersReducedMotion()) { onReply?.(message); return }
    gsap.timeline()
      .to(el, { x: isOwn ? -20 : 20, duration: 0.12, ease: EASE.out })
      .to(el, { x: 0, duration: 0.28, ease: `cubic-bezier(${EASE.iosSpring.join(',')})` })
      .call(() => onReply?.(message))
  }

  const time = new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={cn('flex flex-col gap-1 max-w-[75%]', isOwn ? 'items-end self-end' : 'items-start self-start')}
      onDoubleClick={handleSwipe}
    >
      {replyMessage && (
        <div className={cn(
          'text-xs px-3 py-1.5 rounded-[var(--radius-sm)] opacity-60 border border-white/10 line-clamp-1',
          isOwn ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 text-white/70',
        )}>
          {replyMessage.body}
        </div>
      )}
      <div
        ref={bubbleRef}
        className={cn(
          'px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm leading-relaxed',
          isOwn
            ? 'bg-[var(--accent)] text-[var(--bg)] rounded-br-sm'
            : 'bg-[var(--surface-elevated)] text-[var(--text)] rounded-bl-sm',
        )}
      >
        {message.body}
      </div>
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] text-[var(--text-muted)]">{time}</span>
        <ReadTicks isOwn={isOwn} isRead={isRead} />
      </div>
    </div>
  )
}
