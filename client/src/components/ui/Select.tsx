import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn.js'
import { Pill } from './Pill.js'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  max?: number
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  max,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      if (max && value.length >= max) return
      onChange([...value, val])
    }
  }

  return (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm text-[var(--text-muted)] font-sans">{label}</label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(!open)}
        className={cn(
          'min-h-[44px] w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md px-3 py-2',
          'flex flex-wrap gap-1.5 items-center cursor-pointer transition-colors duration-150',
          'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
          open && 'border-[var(--accent)]',
        )}
      >
        {value.length === 0 ? (
          <span className="text-sm text-[var(--text-muted)]">{placeholder}</span>
        ) : (
          value.map((v) => (
            <Pill
              key={v}
              label={options.find((o) => o.value === v)?.label ?? v}
              variant="accent"
              onRemove={() => toggle(v)}
            />
          ))
        )}
      </div>

      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const selected = value.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm font-sans transition-colors duration-100',
                    selected
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                      : 'text-[var(--text)] hover:bg-white/5',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
