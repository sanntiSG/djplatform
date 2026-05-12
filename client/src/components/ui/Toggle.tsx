import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { prefersReducedMotion } from '../../utils/motion.js'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
  className?: string
}

export function Toggle({ checked, onChange, disabled = false, label, id, className }: ToggleProps) {
  const trackRef = useRef<HTMLButtonElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const thumb = thumbRef.current
    const track = trackRef.current
    if (!thumb || !track) return

    const reduced = prefersReducedMotion()
    const duration = reduced ? 0 : 0.2
    const targetX = checked ? 20 : 0
    const targetBg = checked ? 'var(--accent)' : 'var(--surface-elevated)'

    gsap.to(thumb, {
      x: targetX,
      duration,
      ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
    })
    gsap.to(track, {
      backgroundColor: targetBg,
      duration: duration + 0.02,
      ease: 'power2.out',
    })
  }, [checked])

  function handleClick() {
    if (disabled) return

    const thumb = thumbRef.current
    const track = trackRef.current
    if (!thumb || !track || prefersReducedMotion()) {
      onChange(!checked)
      return
    }

    // Quick scale bounce on click
    gsap.to(thumb, {
      scale: 0.88,
      duration: 0.08,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(thumb, { scale: 1, duration: 0.32, ease: 'elastic.out(1, 0.6)' })
      },
    })

    onChange(!checked)
  }

  return (
    <label
      htmlFor={id}
      className={cn('inline-flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-40 cursor-not-allowed', className)}
    >
      <button
        ref={trackRef}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className="relative w-11 h-6 rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
        style={{
          backgroundColor: checked ? 'var(--accent)' : 'var(--surface-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '2px',
        }}
      >
        <span
          ref={thumbRef}
          aria-hidden
          className="block w-5 h-5 rounded-full bg-white"
          style={{
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            willChange: 'transform',
          }}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-[var(--text)] leading-none">{label}</span>
      )}
    </label>
  )
}
