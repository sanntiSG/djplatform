import { Link } from 'react-router-dom'
import type { TrendingCollabItem } from '../../services/collaborationsService.js'

const TYPE_CONFIG: Record<string, { label: string; color: string; fallbackGradient: string }> = {
  track:       { label: 'Track',    color: 'var(--accent)',   fallbackGradient: 'linear-gradient(135deg, #d4ff00 0%, #08080a 100%)' },
  event:       { label: 'Evento',   color: 'var(--c-pink)',   fallbackGradient: 'linear-gradient(135deg, var(--c-pink) 0%, #08080a 100%)' },
  visual:      { label: 'Visual',   color: 'var(--c-purple)', fallbackGradient: 'linear-gradient(135deg, var(--c-purple) 0%, #08080a 100%)' },
  opportunity: { label: 'Proyecto', color: 'var(--c-teal)',   fallbackGradient: 'linear-gradient(135deg, var(--c-teal) 0%, #08080a 100%)' },
  other:       { label: 'Collab',   color: 'var(--c-orange)', fallbackGradient: 'linear-gradient(135deg, var(--c-orange) 0%, #08080a 100%)' },
}

interface Props {
  collab: TrendingCollabItem
}

export function CollabPoster({ collab }: Props) {
  const cfg = TYPE_CONFIG[collab.type ?? 'other'] ?? TYPE_CONFIG.other
  const nameA = collab.fromArtistName
  const nameB = collab.toArtistName
  const hasA = Boolean(collab.fromAvatar)
  const hasB = Boolean(collab.toAvatar)
  const hasBoth = hasA && hasB
  const hasAny = hasA || hasB

  return (
    <Link
      to={`/p/${collab.fromProfileId}`}
      className="collab-poster group relative overflow-hidden rounded-[var(--radius-md)] block"
      style={{ height: 148 }}
    >
      {/* Background layer — image-first */}
      {hasBoth ? (
        <div className="absolute inset-0 flex">
          <div className="relative w-1/2 h-full overflow-hidden">
            <img
              src={collab.fromAvatar}
              alt={nameA}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              style={{ filter: 'brightness(0.55) contrast(1.12)' }}
            />
          </div>
          {/* Hairline divider */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="relative w-1/2 h-full overflow-hidden">
            <img
              src={collab.toAvatar}
              alt={nameB}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              style={{ filter: 'brightness(0.55) contrast(1.12)' }}
            />
          </div>
        </div>
      ) : hasAny ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={hasA ? collab.fromAvatar : collab.toAvatar}
            alt={hasA ? nameA : nameB}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            style={{ filter: 'brightness(0.55) contrast(1.12)' }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: cfg.fallbackGradient, opacity: 0.55 }}
        />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.78))' }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-3">

        {/* Top — kicker + live dot */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-sans uppercase tracking-widest text-white/70 leading-none"
            style={{ fontSize: '10px' }}
          >
            COLLAB
            <span style={{ color: cfg.color }}> · </span>
            {cfg.label.toUpperCase()}
          </span>
          <span
            className="flex-shrink-0 rounded-full collab-live-dot"
            style={{
              width: 6,
              height: 6,
              background: cfg.color,
              animation: 'collab-pulse 2.4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Bottom — names + title */}
        <div>
          <p className="font-display font-semibold text-white text-sm leading-tight tracking-tight line-clamp-2">
            {nameA} &times; {nameB}
          </p>
          {collab.title && (
            <p
              className="font-sans text-white/55 mt-0.5 truncate"
              style={{ fontSize: '11px' }}
            >
              {collab.title}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes collab-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .collab-live-dot { animation: none !important; }
          .collab-poster img { transition: none !important; }
        }
      `}</style>
    </Link>
  )
}
