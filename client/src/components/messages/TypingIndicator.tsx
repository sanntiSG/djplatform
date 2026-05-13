import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

export function TypingIndicator() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLSpanElement[]>([])

  // Entrance animation
  useEffect(() => {
    const el = containerRef.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el,
      { opacity: 0, y: 8, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.pop },
    )
  }, [])

  // Dot bounce loop
  useEffect(() => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 })
    dotsRef.current.forEach((dot, i) => {
      tl.to(dot, { y: -5, duration: 0.22, ease: 'power2.out' }, i * 0.12)
        .to(dot, { y: 0, duration: 0.26, ease: 'bounce.out' }, i * 0.12 + 0.22)
    })
    return () => { tl.kill() }
  }, [])

  return (
    <div
      ref={containerRef}
      className="self-start bg-[var(--surface-elevated)] rounded-[20px] rounded-bl-[6px] px-4 py-3 flex items-center gap-1.5 border border-white/5"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          ref={el => { if (el) dotsRef.current[i] = el }}
          className="w-2 h-2 rounded-full bg-white/30 inline-block"
        />
      ))}
    </div>
  )
}
