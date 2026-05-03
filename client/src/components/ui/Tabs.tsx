import { cn } from '../../utils/cn.js'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
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
