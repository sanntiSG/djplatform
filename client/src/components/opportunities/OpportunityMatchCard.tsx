import { Link } from 'react-router-dom'
import type { OpportunityResponse } from '../../services/opportunityService.js'
import { roleLabel } from '@dj/shared'

interface Props {
  opportunity: OpportunityResponse
  matchedRoles: string[]
}

export function OpportunityMatchCard({ opportunity: o, matchedRoles }: Props) {
  const nonMatchedRoles = o.lookingForRoles.filter((r) => !matchedRoles.includes(r))

  return (
    <Link
      to={`/oportunidades/${o.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 hover:border-[var(--accent)]/20 transition-all duration-300 group active:scale-[0.99] relative overflow-hidden"
      style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent)' }}
    >
      {/* Kicker */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse flex-shrink-0" />
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--accent)] font-semibold">
          Para vos
        </span>
      </div>

      {/* Publisher */}
      <div className="flex items-center gap-3 mb-4">
        {o.avatar ? (
          <img
            src={o.avatar}
            alt={o.artistName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
            <span className="font-display text-sm font-semibold text-[var(--text-muted)]">
              {o.artistName.charAt(0)}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-sans text-xs text-[var(--text-muted)] truncate">{o.artistName}</p>
          {o.location && (
            <p className="font-sans text-[10px] text-[var(--text-muted)] opacity-50 truncate">{o.location}</p>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-display font-semibold text-[var(--text)] leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors duration-200"
        style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)' }}
      >
        {o.title}
      </h3>

      {/* Description */}
      {o.description && (
        <p className="font-sans text-sm text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2">
          {o.description}
        </p>
      )}

      {/* Role chips — matched first (solid lime), rest secondary */}
      {(matchedRoles.length > 0 || nonMatchedRoles.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {matchedRoles.map((r) => (
            <span
              key={r}
              className="rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {roleLabel(r)}
            </span>
          ))}
          {nonMatchedRoles.map((r) => (
            <span
              key={r}
              className="rounded-full px-2.5 py-0.5 font-sans text-xs font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              {roleLabel(r)}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        {o.isPaid && (
          <span className="rounded-full px-2.5 py-0.5 font-sans text-xs font-medium bg-[var(--c-teal-muted)] text-[var(--c-teal)]">
            Pago
          </span>
        )}
        {o.isRemote && (
          <span className="rounded-full px-2.5 py-0.5 font-sans text-xs font-medium bg-[var(--c-purple-muted)] text-[var(--c-purple)]">
            Remoto
          </span>
        )}
        <span className="ml-auto font-sans text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-200">
          Ver oportunidad &rarr;
        </span>
      </div>
    </Link>
  )
}
