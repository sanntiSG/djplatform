import { useRef, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

interface FollowButtonProps {
  isFollowing: boolean
  onToggle: () => void
  isPending?: boolean
  className?: string
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function FollowButton({
  isFollowing,
  onToggle,
  isPending = false,
  className = '',
}: FollowButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const checkRef = useRef<SVGSVGElement | null>(null)
  const prevFollowing = useRef(isFollowing)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      prevFollowing.current = isFollowing
      return
    }

    const btn = btnRef.current
    if (!btn || prefersReducedMotion()) {
      prevFollowing.current = isFollowing
      return
    }

    const wasFollowing = prevFollowing.current
    prevFollowing.current = isFollowing

    if (!wasFollowing && isFollowing) {
      // Confirmed follow: pop + settle
      gsap.fromTo(btn,
        { scale: 0.92 },
        { scale: 1, duration: DURATION.base, ease: EASE.pop },
      )
    } else if (wasFollowing && !isFollowing) {
      // Unfollowed: horizontal shake
      gsap.to(btn, {
        keyframes: [
          { x: -5, duration: 0.055, ease: 'none' },
          { x: 4, duration: 0.055, ease: 'none' },
          { x: -3, duration: 0.05, ease: 'none' },
          { x: 0, duration: 0.05, ease: 'none' },
        ],
      })
    }
  }, [isFollowing])

  const handleClick = useCallback(() => {
    if (isPending) return
    const btn = btnRef.current
    if (btn && !prefersReducedMotion()) {
      gsap.to(btn, { scale: 0.93, duration: DURATION.tap, ease: EASE.out, yoyo: true, repeat: 1 })
    }
    onToggle()
  }, [isPending, onToggle])

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={isPending}
      onClick={handleClick}
      aria-label={isFollowing ? 'Dejar de seguir' : 'Seguir'}
      className={`font-sans text-sm font-medium px-6 py-2.5 rounded-full disabled:opacity-50 select-none ${className}`}
      style={{
        willChange: 'transform',
        transition: 'background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease',
        ...(isFollowing
          ? {
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'var(--text-muted)',
            }
          : {
              background: 'var(--accent)',
              border: '1.5px solid var(--accent)',
              color: 'var(--bg)',
            }),
      }}
    >
      <span className="flex items-center gap-1.5">
        {isFollowing && <CheckIcon />}
        {isFollowing ? 'Siguiendo' : 'Seguir'}
      </span>
    </button>
  )
}
