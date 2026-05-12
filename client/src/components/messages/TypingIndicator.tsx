import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion.js'

export function TypingIndicator() {
  const dotsRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({ repeat: -1 })
    dotsRef.current.forEach((dot, i) => {
      tl.to(dot, { y: -4, duration: 0.22, ease: 'power2.out' }, i * 0.12)
        .to(dot, { y: 0, duration: 0.22, ease: 'power2.in' }, i * 0.12 + 0.22)
    })
    return () => { tl.kill() }
  }, [])

  return (
    <div className="self-start bg-[var(--surface-elevated)] rounded-[var(--radius-md)] rounded-bl-sm px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          ref={el => { if (el) dotsRef.current[i] = el }}
          className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block"
        />
      ))}
    </div>
  )
}
