import { useRef, useEffect, type ReactNode } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { prefersReducedMotion } from '../../utils/motion.js'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
  variant?: 'pill' | 'instagram' | 'pill-ios'
}

export function Tabs({ tabs, active, onChange, className, variant = 'pill' }: TabsProps) {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (variant !== 'instagram') return
    const container = containerRef.current
    const indicator = indicatorRef.current
    if (!container || !indicator) return

    const activeIndex = tabs.findIndex((t) => t.id === active)
    const btn = buttonRefs.current[activeIndex]
    if (!btn) return

    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const left = btnRect.left - containerRect.left
    const width = btnRect.width

    indicator.style.transition = 'left 0.3s cubic-bezier(0.23, 1, 0.32, 1), width 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
    indicator.style.left = `${left}px`
    indicator.style.width = `${width}px`
  }, [active, tabs, variant])

  if (variant === 'pill-ios') {
    function handlePillClick(id: string, idx: number) {
      if (!prefersReducedMotion()) {
        const el = pillRefs.current[idx]
        if (el) gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.44, ease: 'back.out(2.5)' })
      }
      onChange(id)
    }

    return (
      <div className={cn('no-scrollbar flex gap-2 overflow-x-auto py-2', className)}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            ref={(el) => { pillRefs.current[idx] = el }}
            type="button"
            onClick={() => handlePillClick(tab.id, idx)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all duration-200 select-none',
              active === tab.id
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)] hover:border-white/25',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'instagram') {
    return (
      <div
        ref={containerRef}
        className={cn('relative flex border-b border-[var(--border)]', className)}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { buttonRefs.current[i] = el }}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 transition-colors duration-150',
              active === tab.id
                ? 'text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            {tab.icon && (
              <span className="block" style={{ width: 20, height: 20 }}>
                {tab.icon}
              </span>
            )}
            <span
              className="font-sans uppercase tracking-widest leading-none"
              style={{ fontSize: 9 }}
            >
              {tab.label}
            </span>
          </button>
        ))}

        <div
          ref={indicatorRef}
          className="absolute bottom-0 h-[2px] bg-[var(--accent)]"
          style={{ left: 0, width: 0 }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-md w-fit',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-1.5 text-sm font-sans rounded transition-all duration-150',
            active === tab.id
              ? 'bg-[var(--surface-elevated)] text-[var(--text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
