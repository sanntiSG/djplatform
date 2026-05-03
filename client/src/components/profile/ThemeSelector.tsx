import { cn } from '../../utils/cn.js'
import type { ProfileTheme } from '../../types/index.js'

export const THEMES: { id: ProfileTheme; label: string; gradient: string; particle: string }[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    gradient: 'linear-gradient(135deg, #08080a 0%, #111114 50%, #1a1a1f 100%)',
    particle: '#d4ff00',
  },
  {
    id: 'neon',
    label: 'Neon',
    gradient: 'linear-gradient(135deg, #020814 0%, #041a0a 50%, #0a2010 100%)',
    particle: '#00ff88',
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    gradient: 'linear-gradient(135deg, #050510 0%, #0d0530 50%, #150a40 100%)',
    particle: '#a855f7',
  },
  {
    id: 'fire',
    label: 'Fire',
    gradient: 'linear-gradient(135deg, #0a0500 0%, #1a0800 50%, #2a1000 100%)',
    particle: '#f97316',
  },
  {
    id: 'void',
    label: 'Void',
    gradient: 'linear-gradient(135deg, #000000 0%, #030303 50%, #050505 100%)',
    particle: '#ffffff',
  },
]

interface ThemeSelectorProps {
  value: ProfileTheme
  onChange: (theme: ProfileTheme) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
        Tema del perfil
      </span>
      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150',
              value === theme.id
                ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                : 'border-[var(--border)] hover:border-white/20',
            )}
          >
            <div
              className="w-full aspect-square rounded-lg relative overflow-hidden"
              style={{ background: theme.gradient }}
            >
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${theme.particle}22, transparent 70%)`,
                }}
              />
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: theme.particle, boxShadow: `0 0 6px ${theme.particle}` }}
              />
            </div>
            <span className="font-sans text-xs text-[var(--text-muted)]">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
