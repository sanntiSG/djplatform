import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

interface LikeButtonProps {
  isLiked: boolean
  likeCount?: number
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

function HeartSVG({ filled, size }: { filled: boolean; size: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 18 : 22
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function LikeButton({
  isLiked,
  likeCount,
  onToggle,
  disabled = false,
  accentColor,
  size = 'md',
  layout = 'column',
  className = '',
}: LikeButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const isAnimating = useRef(false)

  const accent = accentColor ?? 'var(--accent)'
  const accentHex = accentColor ?? '#d4ff00'

  const fireParticles = useCallback(() => {
    const container = containerRef.current
    if (!container || prefersReducedMotion()) return

    const COUNT = 6
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement('span')
      const angle = (360 / COUNT) * i + randomBetween(-15, 15)
      const distance = randomBetween(16, 30)
      const rad = (angle * Math.PI) / 180
      const tx = Math.cos(rad) * distance
      const ty = Math.sin(rad) * distance
      const sz = randomBetween(3, 5)

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
          scale: randomBetween(0.6, 1.2),
          opacity: 0,
          duration: 0.38 + randomBetween(0, 0.14),
          ease: EASE.out,
          delay: randomBetween(0, 0.05),
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

    if (!isLiked) {
      isAnimating.current = true
      gsap.timeline({ onComplete: () => { isAnimating.current = false } })
        .to(icon, { scale: 1.38, duration: DURATION.micro, ease: EASE.popStrong })
        .to(icon, { scale: 0.90, duration: DURATION.tap, ease: EASE.inOut })
        .to(icon, { scale: 1, duration: DURATION.micro, ease: EASE.pop })

      fireParticles()
    } else {
      gsap.fromTo(icon, { scale: 0.82 }, { scale: 1, duration: DURATION.base, ease: EASE.out })
    }
  }, [disabled, isLiked, onToggle, fireParticles])

  const flexDir = layout === 'row' ? 'flex-row' : 'flex-col'

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={isLiked ? 'Quitar like' : 'Dar like'}
      className={`relative flex ${flexDir} items-center gap-1 disabled:opacity-50 select-none ${className}`}
      style={{ color: isLiked ? accent : 'rgba(255,255,255,0.85)' }}
    >
      <span ref={containerRef} className="relative block" style={{ overflow: 'visible' }}>
        <span ref={iconRef} className="block" style={{ willChange: 'transform' }}>
          <HeartSVG filled={isLiked} size={size} />
        </span>
      </span>
      {(likeCount ?? 0) > 0 && (
        <span className="font-sans text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {likeCount}
        </span>
      )}
    </button>
  )
}
