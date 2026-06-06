import { Link } from 'react-router-dom'
import { useActivityFeed } from '../hooks/useActivityFeed.js'
import type { ActivityEvent } from '../services/activityService.js'

const PILL: Record<string, { label: string; bg: string; text: string }> = {
  profile_created: { label: 'Nuevo artista', bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
  event_published: { label: 'Evento', bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  media_added: { label: 'Nueva musica', bg: 'var(--c-pink-muted)', text: 'var(--c-pink)' },
  photo_added: { label: 'Nueva foto', bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  profile_updated: { label: 'Actualizo perfil', bg: 'rgba(212,255,0,0.1)', text: 'var(--accent)' },
  collab_verified: { label: 'Colaboración', bg: 'rgba(212,255,0,0.12)', text: 'var(--accent)' },
  opportunity_posted: { label: 'Nueva oportunidad', bg: 'rgba(212,255,0,0.12)', text: 'var(--accent)' },
  project_created:   { label: 'Nuevo proyecto',   bg: 'rgba(167,139,250,0.12)', text: 'var(--c-purple, #a78bfa)' },
  project_progress:  { label: 'Avance',           bg: 'rgba(167,139,250,0.12)', text: 'var(--c-purple, #a78bfa)' },
  project_completed: { label: 'Completado',       bg: 'var(--accent-muted)', text: 'var(--accent)' },
  trending_track: { label: 'En tendencia', bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  trending_artist: { label: 'Artista popular', bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
  news_article: { label: 'Noticias', bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

const DESC: Record<string, (a: ActivityEvent) => string> = {
  profile_created: (a) => `${a.actorName} se unio a la plataforma`,
  event_published: (a) => `${a.actorName} publico un evento`,
  media_added: (a) => `${a.actorName} subio nueva musica`,
  photo_added: (a) => `${a.actorName} agrego fotos`,
  profile_updated: (a) => `${a.actorName} actualizo su perfil`,
  collab_verified: (a) => a.partnerName
    ? `${a.actorName} colaboró con ${a.partnerName}${a.targetTitle ? ` en ${a.targetTitle}` : ''}`
    : `${a.actorName} confirmó una colaboración`,
  opportunity_posted: (a) => `${a.actorName} publicó una oportunidad`,
  project_created:   (a) => `${a.actorName} inicio un proyecto: ${a.targetTitle ?? ''}`,
  project_progress:  (a) => `${a.actorName} publico el avance de "${a.targetTitle ?? 'su proyecto'}"`,
  project_completed: (a) => `"${a.targetTitle ?? 'Un proyecto'}" fue completado por ${a.actorName}`,
  trending_track: (a) => a.actorName,
  trending_artist: (a) => a.actorName,
  news_article: (a) => a.actorName,
}

const REGION_LABEL: Record<string, string> = {
  ar: 'Argentina',
  latam: 'Latinoamerica',
  world: 'Internacional',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const pill = PILL[event.type] ?? PILL.profile_updated
  const desc = DESC[event.type]?.(event) ?? event.actorName
  const isExternal = event.isExternal || event.type === 'trending_track' || event.type === 'news_article' || event.type === 'trending_artist'
  const href = event.targetUrl ?? (event.actorSlug ? `/p/${event.actorSlug}` : '/feed')
  const img = event.targetImage ?? event.actorAvatar

  const inner = (
    <div className="flex flex-col gap-3 h-full">
      {/* Image */}
      {img && (
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0">
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      {!img && (
        <div
          className="w-full aspect-square rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--surface-elevated)' }}
        >
          <span className="font-display font-semibold text-2xl text-[var(--text-muted)]">
            {(event.actorName ?? '?').charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.14em] rounded-full px-2 py-0.5"
            style={{ background: pill.bg, color: pill.text }}
          >
            {pill.label}
          </span>
          <span className="font-sans text-[10px] text-[var(--text-muted)] tabular-nums flex-shrink-0">
            {timeAgo(event.createdAt)}
          </span>
        </div>

        {event.targetTitle && (
          <p className="font-sans text-xs md:text-sm font-medium text-[var(--text)] leading-snug line-clamp-2">
            {event.targetTitle}
          </p>
        )}

        <p className="font-sans text-[10px] md:text-xs text-[var(--text-muted)] line-clamp-1">{desc}</p>

        {event.region && (
          <span className="font-sans text-[10px] text-[var(--text-muted)]">
            {REGION_LABEL[event.region] ?? event.region}
          </span>
        )}
      </div>
    </div>
  )

  const cls =
    'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col cursor-pointer hover:border-[color:var(--text-muted)] transition-colors duration-150 no-underline'

  if (isExternal && href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={href} className={cls}>
      {inner}
    </Link>
  )
}

export default function Activity() {
  const { data: items, isLoading } = useActivityFeed(100)

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 md:px-6 pb-24 pt-20 md:pt-28">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Actividad
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Novedades de la plataforma, tendencias musicales y noticias de la escena.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !items?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-display text-[var(--text-muted)] text-lg">No hay actividad reciente</p>
            <Link to="/feed" className="font-sans text-sm text-[var(--accent)] hover:underline">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => (
              <ActivityItem key={item.id} event={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
