import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = btnRef.current
    if (!el) return

    const onDown = () => {
      if (prefersReducedMotion() || el.disabled) return
      gsap.to(el, { scale: 0.93, duration: 0.1, ease: 'power2.out', overwrite: true })
    }
    const onUp = () => {
      if (prefersReducedMotion() || el.disabled) return
      gsap.to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)', overwrite: true })
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onUp)
    }
  }, [])

  return (
    <button
      ref={btnRef}
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-sans font-medium rounded-md select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'transition-[opacity,background-color,border-color] duration-[0.14s]',
        '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
        {
          'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90': variant === 'primary',
          'bg-transparent text-[var(--text)] hover:bg-white/5': variant === 'ghost',
          'bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-white/20':
            variant === 'outline',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5 text-sm': size === 'md',
          'px-7 py-3.5 text-base': size === 'lg',
        },
        className,
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
