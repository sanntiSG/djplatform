import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

interface AnalyzingIndicatorProps {
  visible: boolean
  label?: string
}

export function AnalyzingIndicator({
  visible,
  label = 'Analizando contenido…',
}: AnalyzingIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: visible ? 1 : 0 })
      return
    }
    if (visible) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 6, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.pop },
      )
    } else {
      gsap.to(el, {
        opacity: 0,
        y: 4,
        scale: 0.97,
        duration: DURATION.micro,
        ease: EASE.softIn,
      })
    }
  }, [visible])

  return (
    <div
      ref={ref}
      aria-live="polite"
      aria-label={visible ? label : undefined}
      className="glass-pill rounded-xl px-4 py-2.5 flex items-center gap-2.5"
      style={{ opacity: 0, pointerEvents: 'none' }}
    >
      {/* Accent pulse dot */}
      <span className="relative flex-shrink-0 w-2 h-2">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'var(--accent)',
            animation: 'pulse-ring 1.2s ease-in-out infinite',
          }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: 'var(--accent)', opacity: 0.9 }}
        />
      </span>

      <span
        className="font-sans text-xs font-medium tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  )
}
