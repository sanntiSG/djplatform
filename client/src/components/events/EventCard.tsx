import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn.js'
import { eventPath } from '../../utils/slug.js'
import type { EventResponse } from '../../types/index.js'

interface EventCardProps {
  event: EventResponse
  className?: string
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function EventCard({ event, className }: EventCardProps) {
  const hasCounts = (event.likeCount ?? 0) + (event.attendCount ?? 0) + (event.commentCount ?? 0) > 0

  return (
    <Link
      to={eventPath(event.slug, event.id)}
      className={cn(
        'group block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden',
        'hover:border-white/15 transition-all duration-200 hover:shadow-lg hover:shadow-black/30',
        className,
      )}
    >
      <div className="relative h-48 overflow-hidden bg-[var(--surface-elevated)]">
        {event.cover ? (
          <img
            src={event.cover}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display font-semibold text-4xl text-[var(--border)]">
              {event.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}
        />
      </div>

      <div className="p-5 flex flex-col gap-2">
        <h3 className="font-display font-semibold text-[var(--text)] text-lg leading-tight line-clamp-2">
          {event.title}
        </h3>

        <p className="text-xs text-[var(--accent)] font-sans">{formatDate(event.date)}</p>

        {event.location && (
          <p className="text-xs text-[var(--text-muted)] font-sans truncate">{event.location}</p>
        )}

        {event.profile && (
          <div className="flex items-center gap-2 mt-1 pt-3 border-t border-[var(--border)]">
            {event.profile.avatar ? (
              <img
                src={event.profile.avatar}
                alt={event.profile.artistName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-[var(--text-muted)]">
                  {event.profile.artistName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-[var(--text-muted)] font-sans flex-1 truncate">
              {event.profile.artistName}
            </span>

            {hasCounts && (
              <div className="flex items-center gap-2 ml-auto">
                {(event.likeCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-sans">
                    <HeartIcon />
                    {event.likeCount}
                  </span>
                )}
                {(event.attendCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-sans">
                    <CalendarIcon />
                    {event.attendCount}
                  </span>
                )}
                {(event.commentCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-sans">
                    <ChatIcon />
                    {event.commentCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
