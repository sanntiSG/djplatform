import { cn } from '../../utils/cn.js'
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
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-sans font-medium transition-all duration-200 rounded-md select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        {
          'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 active:scale-95':
            variant === 'primary',
          'bg-transparent text-[var(--text)] hover:bg-white/5 active:scale-95':
            variant === 'ghost',
          'bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-white/20 active:scale-95':
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
