import { cn } from '../../utils/cn.js'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-[var(--text-muted)] font-sans">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md',
          'px-4 py-3 text-[var(--text)] text-sm font-sans placeholder:text-[var(--text-muted)]',
          'transition-all duration-150',
          'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
          error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500',
          className,
        )}
      />
      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
    </div>
  )
}
