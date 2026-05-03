import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAdminEvents,
  useAdminSetEventVisibility,
  useAdminDeleteEvent,
} from '../../hooks/useAdmin.js'
import { Button } from '../../components/ui/Button.js'
import { cn } from '../../utils/cn.js'
import { eventPath, profilePath, toSlug } from '../../utils/slug.js'
import type { EventResponse } from '../../types/index.js'

type VisibilityFilter = 'all' | 'true' | 'false'

const FILTER_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Visibles' },
  { value: 'false', label: 'Ocultos' },
]

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function EventRow({ event }: { event: EventResponse }) {
  const setVisibility = useAdminSetEventVisibility()
  const deleteEvent = useAdminDeleteEvent()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    deleteEvent.mutate(event.id)
    setConfirming(false)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
      <div className="w-12 h-10 rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0">
        {event.cover ? (
          <img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-sans text-xs text-[var(--border)]">sin foto</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={eventPath(event.slug, event.id)}
            target="_blank"
            className="font-sans text-sm font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors truncate"
          >
            {event.title}
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="font-sans text-xs text-[var(--text-muted)]">{formatDate(event.date)}</p>
          {event.profile && (
            <Link
              to={profilePath(toSlug(event.profile.artistName), event.profile.id)}
              target="_blank"
              className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              {event.profile.artistName}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            event.isVisible ? 'bg-emerald-400' : 'bg-red-400',
          )}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVisibility.mutate({ id: event.id, isVisible: !event.isVisible })}
          loading={setVisibility.isPending && setVisibility.variables?.id === event.id}
        >
          {event.isVisible ? 'Ocultar' : 'Mostrar'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={deleteEvent.isPending && deleteEvent.variables === event.id}
          className={confirming ? 'text-red-400 hover:text-red-300' : 'text-[var(--text-muted)]'}
        >
          {confirming ? 'Confirmar' : 'Eliminar'}
        </Button>
        {confirming && (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

export default function AdminEvents() {
  const [filter, setFilter] = useState<VisibilityFilter>('all')
  const { data: events, isLoading } = useAdminEvents(filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors duration-150',
                filter === opt.value
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="font-sans text-xs text-[var(--text-muted)]">
          {events?.length ?? 0} eventos
        </span>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !events?.length ? (
          <p className="text-center font-sans text-sm text-[var(--text-muted)] py-16">
            No hay eventos
          </p>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  )
}
