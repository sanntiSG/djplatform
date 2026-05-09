import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

interface ToastProps {
  message: string
  onDismiss: () => void
  duration?: number
  variant?: 'error' | 'success' | 'info'
}

export function Toast({ message, onDismiss, duration = 3000, variant = 'error' }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!prefersReducedMotion()) {
      gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: DURATION.base, ease: EASE.pop })
    }

    const timer = setTimeout(() => {
      if (!el || prefersReducedMotion()) { onDismiss(); return }
      gsap.to(el, { y: 24, opacity: 0, duration: DURATION.micro, ease: EASE.softIn, onComplete: onDismiss })
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const colors: Record<string, { bg: string; text: string }> = {
    error: { bg: 'rgba(239,68,68,0.95)', text: '#fff' },
    success: { bg: 'rgba(34,197,94,0.95)', text: '#fff' },
    info: { bg: 'rgba(255,255,255,0.12)', text: 'var(--text)' },
  }

  const { bg, text } = colors[variant]

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl font-sans text-sm font-medium shadow-lg"
      style={{ background: bg, color: text, backdropFilter: 'blur(12px)', maxWidth: 340, textAlign: 'center' }}
    >
      {message}
    </div>
  )
}
