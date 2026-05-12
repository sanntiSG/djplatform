import { useRef } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { useStartConversation } from '../../hooks/useConversations.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { cn } from '../../utils/cn.js'

interface Props {
  targetUserId: string
  className?: string
  variant?: 'primary' | 'ghost'
}

export function ContactButton({ targetUserId, className, variant = 'primary' }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const { mutate: startConv, isPending } = useStartConversation()
  const user = useAuthStore(s => s.user)

  function handleClick() {
    const btn = btnRef.current
    if (btn && !prefersReducedMotion()) {
      gsap.timeline()
        .to(btn, { scale: 0.93, duration: DURATION.tap, ease: EASE.out })
        .to(btn, { scale: 1, duration: DURATION.base, ease: `cubic-bezier(${EASE.iosSpring.join(',')})` })
    }
    if (!user) return
    startConv(targetUserId)
  }

  if (!user || user.id === targetUserId) return null

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded-[var(--radius-md)] transition-colors',
        variant === 'primary'
          ? 'bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent)]/90 px-5 py-2.5 text-sm'
          : 'border border-white/15 text-[var(--text)] hover:bg-white/5 px-4 py-2 text-sm',
        isPending && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Enviar mensaje
    </button>
  )
}
