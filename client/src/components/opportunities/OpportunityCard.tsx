import { Link } from 'react-router-dom'
import type { OpportunityResponse } from '../../services/opportunityService.js'

const ROLE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  vocalist: 'Vocalista',
  designer: 'Disenador',
  organizer: 'Organizador',
  visuals: 'Visuales',
}

interface Props {
  opportunity: OpportunityResponse
}

export function OpportunityCard({ opportunity: o }: Props) {
  const date = o.eventDate
    ? new Date(o.eventDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : null

  const isClosed = o.status === 'filled' || o.status === 'closed'

  return (
    <Link
      to={`/oportunidades/${o.id}`}
      className={`block rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 hover:border-white/15 transition-all duration-200 group active:scale-[0.99] relative overflow-hidden${isClosed ? ' opacity-60 grayscale' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {o.avatar ? (
          <img
            src={o.avatar}
            alt={o.artistName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
            <span className="font-display text-sm font-semibold text-[var(--text-muted)]">
              {o.artistName.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs text-[var(--text-muted)] truncate">{o.artistName}</p>
          {o.location && (
            <p className="font-sans text-xs text-[var(--text-muted)] opacity-60 truncate">{o.location}</p>
          )}
        </div>
        {date && (
          <span className="flex-shrink-0 font-sans text-xs text-[var(--text-muted)]">{date}</span>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-display font-semibold text-[var(--text)] leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors duration-200"
        style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}
      >
        {o.title}
      </h3>

      {/* Description excerpt */}
      {o.description && (
        <p
          className="font-sans text-sm text-[var(--text-muted)] leading-relaxed mb-4 line-clamp-2"
        >
          {o.description}
        </p>
      )}

      {/* Role chips */}
      {o.lookingForRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {o.lookingForRoles.map((r) => (
            <span
              key={r}
              className="rounded-full px-2.5 py-0.5 font-sans text-xs font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              {ROLE_LABEL[r] ?? r}
            </span>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        {o.status === 'open' ? (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-medium"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Disponible
          </span>
        ) : (
          <span
            className="rounded-full px-2.5 py-0.5 font-sans text-xs font-medium"
            style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            Cubierta
          </span>
        )}
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
        {o.applicantCount > 0 && (
          <span className="font-sans text-xs text-[var(--text-muted)] ml-auto">
            {o.applicantCount} {o.applicantCount === 1 ? 'interesado' : 'interesados'}
          </span>
        )}
      </div>
    </Link>
  )
}
