import { Link } from 'react-router-dom'
import type { TrendingCollabItem } from '../../services/collaborationsService.js'

const TYPE_CONFIG: Record<string, { label: string; color: string; muted: string }> = {
  track:       { label: 'Track',    color: 'var(--accent)',   muted: 'var(--accent-muted)' },
  event:       { label: 'Evento',   color: 'var(--c-pink)',   muted: 'var(--c-pink-muted)' },
  visual:      { label: 'Visual',   color: 'var(--c-purple)', muted: 'var(--c-purple-muted)' },
  opportunity: { label: 'Proyecto', color: 'var(--c-teal)',   muted: 'var(--c-teal-muted)' },
  other:       { label: 'Collab',   color: 'var(--c-orange)', muted: 'var(--c-orange-muted)' },
}

function AvatarCircle({ src, name, size }: { src?: string; name: string; size: number }) {
  const initials = name.charAt(0).toUpperCase()
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, boxShadow: '0 0 0 2px var(--surface-elevated)' }}
    />
  ) : (
    <div
      className="rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, boxShadow: '0 0 0 2px var(--surface-elevated)' }}
    >
      <span className="font-display text-xs font-bold text-[var(--text-muted)]">{initials}</span>
    </div>
  )
}

interface Props {
  collab: TrendingCollabItem
}

export function CollabPoster({ collab }: Props) {
  const cfg = TYPE_CONFIG[collab.type ?? 'other'] ?? TYPE_CONFIG.other
  const nameA = collab.fromArtistName
  const nameB = collab.toArtistName

  return (
    <Link
      to={`/p/${collab.fromProfileId}`}
      className="collab-poster group relative overflow-hidden rounded-[var(--radius-md)] block"
      style={{ height: 148 }}
    >
      {/* Tinted background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          background: `radial-gradient(ellipse at 10% 50%, ${cfg.muted} 0%, transparent 65%), var(--surface-elevated)`,
        }}
      />

      {/* Hover ring */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[var(--radius-md)]"
        style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${cfg.color} 30%, transparent)` }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex gap-3 p-3">

        {/* Left — avatars */}
        <div className="flex flex-col justify-center items-center flex-shrink-0">
          <div className="relative" style={{ width: 52 }}>
            <AvatarCircle src={collab.fromAvatar} name={nameA} size={34} />
            <div className="absolute" style={{ top: 18, left: 18 }}>
              <AvatarCircle src={collab.toAvatar} name={nameB} size={34} />
            </div>
          </div>
        </div>

        {/* Right — editorial text */}
        <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">

          {/* Top: badge + type label */}
          <div className="flex items-start justify-between gap-1">
            <span
              className="font-sans text-[8px] uppercase tracking-[0.2em] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: cfg.color, background: cfg.muted, lineHeight: 1.8 }}
            >
              Collab
            </span>
            <span
              className="font-display font-bold uppercase leading-none tracking-tight flex-shrink-0"
              style={{ fontSize: 'clamp(1.05rem, 3vw, 1.35rem)', color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Middle: artist names */}
          <div className="flex-1 flex items-center">
            <p
              className="font-sans font-semibold leading-tight text-[var(--text)] group-hover:text-[var(--text)] transition-colors duration-200 w-full"
              style={{ fontSize: '0.7rem' }}
            >
              <span className="truncate block">
                {nameA}
                <span style={{ color: cfg.color }}> x </span>
                {nameB}
              </span>
            </p>
          </div>

          {/* Bottom: collab title + accent line */}
          <div>
            <p
              className="font-sans text-[var(--text-muted)] leading-tight truncate"
              style={{ fontSize: '0.62rem' }}
            >
              {collab.title}
            </p>
            <div
              className="mt-2 h-px w-0 group-hover:w-full transition-all duration-500 ease-out"
              style={{ background: cfg.color }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
