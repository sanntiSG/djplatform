import { cn } from '../../utils/cn.js'

interface PillProps {
  label: string
  variant?: 'default' | 'accent' | 'available' | 'contact' | 'unavailable'
  onRemove?: () => void
  className?: string
}

const variantClasses = {
  default: 'bg-white/5 text-[var(--text-muted)] border-[var(--border)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/20',
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  contact: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  unavailable: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function Pill({ label, variant = 'default', onRemove, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-sans font-medium shrink-0',
        variantClasses[variant],
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
          aria-label={`Eliminar ${label}`}
        >
          x
        </button>
      )}
    </span>
  )
}
