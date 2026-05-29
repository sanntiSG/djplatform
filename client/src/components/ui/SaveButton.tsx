import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

interface SaveButtonProps {
  isSaved: boolean
  onToggle: () => void
  disabled?: boolean
  accentColor?: string
  size?: 'sm' | 'md'
  layout?: 'column' | 'row'
  className?: string
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function BookmarkSVG({ filled, size }: { filled: boolean; size: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 18 : 21
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function SaveButton({
  isSaved,
  onToggle,
  disabled = false,
  accentColor,
  size = 'md',
  layout = 'column',
  className = '',
}: SaveButtonProps) {
  const iconRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const isAnimating = useRef(false)

  const accent = accentColor ?? 'var(--accent)'
  const accentHex = accentColor ?? '#d4ff00'

  const fireParticles = useCallback(() => {
    const container = containerRef.current
    if (!container || prefersReducedMotion()) return

    const COUNT = 5
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement('span')
      const angle = (360 / COUNT) * i + randomBetween(-20, 20)
      const distance = randomBetween(14, 26)
      const rad = (angle * Math.PI) / 180
      const tx = Math.cos(rad) * distance
      const ty = Math.sin(rad) * distance
      const sz = randomBetween(2.5, 4.5)

      dot.style.cssText = `
        position: absolute;
        width: ${sz}px;
        height: ${sz}px;
        border-radius: 50%;
        background: ${accentHex};
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        will-change: transform, opacity;
      `
      container.appendChild(dot)

      gsap.fromTo(
        dot,
        { scale: 0, opacity: 1, x: 0, y: 0 },
        {
          x: tx,
          y: ty,
          scale: randomBetween(0.5, 1.1),
          opacity: 0,
          duration: 0.36 + randomBetween(0, 0.12),
          ease: EASE.out,
          delay: randomBetween(0, 0.04),
          onComplete: () => dot.remove(),
        },
      )
    }
  }, [accentHex])

  const handleClick = useCallback(() => {
    if (disabled || isAnimating.current) return

    const icon = iconRef.current
    if (!icon) { onToggle(); return }

    onToggle()

    if (prefersReducedMotion()) return

    if (!isSaved) {
      isAnimating.current = true
      gsap.timeline({ onComplete: () => { isAnimating.current = false } })
        .to(icon, { scale: 1.38, duration: DURATION.micro, ease: EASE.popStrong })
        .to(icon, { scale: 0.90, duration: DURATION.tap, ease: EASE.inOut })
        .to(icon, { scale: 1, duration: DURATION.micro, ease: EASE.pop })

      fireParticles()
    } else {
      gsap.fromTo(icon, { scale: 0.82 }, { scale: 1, duration: DURATION.base, ease: EASE.out })
    }
  }, [disabled, isSaved, onToggle, fireParticles])

  const flexDir = layout === 'row' ? 'flex-row' : 'flex-col'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={isSaved ? 'Quitar de guardados' : 'Guardar cancion'}
      className={`relative flex ${flexDir} items-center gap-1 disabled:opacity-50 select-none ${className}`}
      style={{ color: isSaved ? accent : 'rgba(255,255,255,0.85)' }}
    >
      <span ref={containerRef} className="relative block" style={{ overflow: 'visible' }}>
        <span ref={iconRef} className="block" style={{ willChange: 'transform' }}>
          <BookmarkSVG filled={isSaved} size={size} />
        </span>
      </span>
    </button>
  )
}
