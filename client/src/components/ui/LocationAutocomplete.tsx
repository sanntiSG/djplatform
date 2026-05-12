import { useState, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { locationService } from '../../services/locationService.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'
import type { LocationResult } from '../../services/locationService.js'

interface Props {
  label?: string
  value: string
  onChange: (name: string, verified: boolean) => void
  placeholder?: string
  error?: string
  className?: string
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function LocationAutocomplete({ label, value, onChange, placeholder, error, className }: Props) {
  const [input, setInput] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debouncedInput = useDebounce(input, 300)

  // Sync external value to input when it changes from outside
  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    if (!focused || debouncedInput.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    let cancelled = false
    setLoading(true)
    locationService.search(debouncedInput)
      .then((res) => {
        if (cancelled) return
        setResults(res)
        setOpen(res.length > 0)
      })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedInput, focused])

  // Animate dropdown in
  useEffect(() => {
    const el = dropdownRef.current
    if (!el || !open) return
    if (prefersReducedMotion()) return
    const items = el.querySelectorAll('.loc-item')
    gsap.fromTo(
      items,
      { y: -6, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.22, stagger: 0.04, ease: 'expo.out' },
    )
  }, [open, results])

  const handleSelect = useCallback((item: LocationResult) => {
    const name = `${item.name}, ${item.province}`
    setInput(name)
    setResults([])
    setOpen(false)
    onChange(name, true)
  }, [onChange])

  const handleBlur = useCallback(() => {
    // Delay so click on dropdown item fires first
    setTimeout(() => {
      setFocused(false)
      setOpen(false)
      // If user typed freely without selecting, treat as unverified
      if (input !== value) {
        onChange(input, false)
      }
    }, 150)
  }, [input, value, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    onChange(e.target.value, false)
  }

  return (
    <div ref={wrapRef} className={cn('flex flex-col gap-1.5 relative', className)}>
      {label && (
        <label className="text-sm text-[var(--text-muted)] font-sans">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={input}
          placeholder={placeholder ?? 'Buscar ciudad...'}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md',
            'px-4 py-3 text-[var(--text)] text-base font-sans placeholder:text-[var(--text-muted)]',
            'transition-all duration-150 pr-10',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500',
          )}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-[100] rounded-xl border border-[var(--border)] overflow-hidden"
          style={{ background: 'var(--surface-elevated)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
              className="loc-item w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-white/5 transition-colors duration-100 border-b border-[var(--border)] last:border-0"
            >
              <span className="font-sans text-sm text-[var(--text)]">{item.name}</span>
              <span className="font-sans text-xs text-[var(--text-muted)]">{item.province}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
    </div>
  )
}
