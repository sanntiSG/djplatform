import { useRef } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import type { InputHTMLAttributes, FocusEvent } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, onFocus, onBlur, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
  const wrapRef = useRef<HTMLDivElement>(null)

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    if (!prefersReducedMotion() && wrapRef.current) {
      gsap.fromTo(wrapRef.current, { scale: 0.985 }, { scale: 1, duration: 0.38, ease: 'back.out(2)' })
    }
    onFocus?.(e)
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    onBlur?.(e)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-[var(--text-muted)] font-sans">
          {label}
        </label>
      )}
      <div ref={wrapRef} style={{ willChange: 'transform' }}>
        <input
          id={inputId}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md',
            'px-4 py-3 text-[var(--text)] text-base font-sans placeholder:text-[var(--text-muted)]',
            'transition-all duration-150',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500',
            className,
          )}
        />
      </div>
      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
    </div>
  )
}
