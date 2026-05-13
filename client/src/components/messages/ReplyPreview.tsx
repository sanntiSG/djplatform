import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import type { MessageItem } from '../../services/conversationsService.js'

interface Props {
  message: MessageItem
  onClose: () => void
}

export function ReplyPreview({ message, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el,
      { opacity: 0, y: 6, height: 0 },
      { opacity: 1, y: 0, height: 'auto', duration: DURATION.base, ease: EASE.softOut },
    )
  }, [])

  function handleClose() {
    const el = ref.current
    if (!el || prefersReducedMotion()) { onClose(); return }
    gsap.to(el, {
      opacity: 0, y: 4, height: 0,
      duration: DURATION.micro,
      ease: EASE.softIn,
      onComplete: onClose,
    })
  }

  return (
    <div
      ref={ref}
      className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border-t border-white/5 overflow-hidden"
    >
      <div className="w-0.5 h-8 bg-[var(--accent)] rounded-full shrink-0" />
      <p className="text-xs text-[var(--text-muted)] line-clamp-1 flex-1 min-w-0">
        <span className="text-[var(--accent)] font-medium mr-1">↩</span>
        {message.body}
      </p>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all duration-150"
        aria-label="Cancelar respuesta"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
