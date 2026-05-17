import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService, type EventAttendee } from '../../services/eventService.js'
import { Button } from '../ui/Button.js'
import { Toast } from '../ui/Toast.js'
import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion.js'
import type { EventResponse } from '../../types/index.js'

interface Props {
  profileId: string
}

export function EventsTab({ profileId }: Props) {
  const qc = useQueryClient()
  const [toast, setToast] = useState<{ msg: string; variant: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [attendeesEvent, setAttendeesEvent] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events', profileId],
    queryFn: () => eventService.listByProfile(profileId),
    enabled: !!profileId,
  })

  const { data: attendees, isLoading: loadingAttendees } = useQuery({
    queryKey: ['event-attendees', attendeesEvent],
    queryFn: () => attendeesEvent ? eventService.listAttendees(attendeesEvent) : Promise.resolve([]),
    enabled: !!attendeesEvent,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-events'] })
      qc.invalidateQueries({ queryKey: ['events-feed'] })
      setToast({ msg: 'Evento eliminado', variant: 'success' })
    },
    onError: () => setToast({ msg: 'No se pudo eliminar el evento', variant: 'error' }),
    onSettled: () => setDeletingId(null),
  })

  // Entrance animation
  useEffect(() => {
    if (!listRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      listRef.current.querySelectorAll('.event-row'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'expo.out', stagger: 0.06 },
    )
  }, [events])

  function handleDelete(id: string) {
    if (!confirm('Eliminar este evento permanentemente?')) return
    setDeletingId(id)
    // Animate out then delete
    if (!prefersReducedMotion()) {
      const row = document.getElementById(`event-row-${id}`)
      if (row) {
        gsap.to(row, {
          opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0,
          duration: 0.3, ease: 'expo.in',
          onComplete: () => deleteMutation.mutate(id),
        })
        return
      }
    }
    deleteMutation.mutate(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Mis eventos
          </p>
          <p className="font-sans text-xs text-[var(--text-muted)] opacity-70 mt-0.5">
            Gestioná los eventos que publicaste.
          </p>
        </div>
        <Link to="/events/new">
          <Button variant="primary" size="sm">Publicar evento</Button>
        </Link>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div ref={listRef} className="flex flex-col gap-3">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isDeleting={deletingId === event.id}
              onDelete={() => handleDelete(event.id)}
              onViewAttendees={() => setAttendeesEvent(attendeesEvent === event.id ? null : event.id)}
              showAttendees={attendeesEvent === event.id}
              attendees={attendees}
              loadingAttendees={loadingAttendees}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-elevated)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-[var(--text)]">No publicaste eventos todavia</p>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-1">Crea tu primer evento y llegá a la escena.</p>
          </div>
          <Link to="/events/new">
            <Button variant="primary" size="sm">Publicar mi primer evento</Button>
          </Link>
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} variant={toast.variant} onDismiss={() => setToast(null)} duration={3000} />
      )}
    </div>
  )
}

/* ── Event row ────────────────────────────────────────────── */

interface EventRowProps {
  event: EventResponse
  isDeleting: boolean
  onDelete: () => void
  onViewAttendees: () => void
  showAttendees: boolean
  attendees?: EventAttendee[]
  loadingAttendees: boolean
}

function EventRow({ event, isDeleting, onDelete, onViewAttendees, showAttendees, attendees, loadingAttendees }: EventRowProps) {
  const date = new Date(event.date).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  return (
    <div
      id={`event-row-${event.id}`}
      className="event-row rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Cover thumbnail */}
        {event.cover ? (
          <img src={event.cover} alt={event.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-[var(--text)] text-sm leading-tight truncate">{event.title}</p>
          <p className="font-sans text-[11px] text-[var(--text-muted)] mt-0.5">{date}{event.location ? ` · ${event.location}` : ''}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onViewAttendees}
              className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {event.attendCount ?? 0} asistentes
            </button>
            <Link
              to={`/events/${event.slug}-${event.id}`}
              className="font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Ver evento
            </Link>
          </div>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors duration-150 disabled:opacity-40"
          aria-label="Eliminar evento"
        >
          {isDeleting ? (
            <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          )}
        </button>
      </div>

      {/* Attendees panel */}
      {showAttendees && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="font-sans text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Asistentes</p>
          {loadingAttendees ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="w-8 h-8 rounded-full skeleton" />)}
            </div>
          ) : attendees && attendees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <Link
                  key={a.id}
                  to={`/p/${a.slug}-${a.id}`}
                  className="flex items-center gap-1.5 rounded-full py-1 px-2.5 transition-colors"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.artistName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center">
                      <span className="font-display text-[8px] text-[var(--text-muted)]">{a.artistName.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-sans text-[11px] text-[var(--text)]">{a.artistName}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-sans text-xs text-[var(--text-muted)]">Aun no hay asistentes confirmados.</p>
          )}
        </div>
      )}
    </div>
  )
}
