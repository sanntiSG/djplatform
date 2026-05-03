import React, { useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import gsap from 'gsap'
import { useEvent } from '../hooks/useEvents.js'
import { WhatsAppButton } from '../components/ui/WhatsAppButton.js'
import { Button } from '../components/ui/Button.js'
import { EventSocialBar } from '../components/events/EventSocialBar.js'
import { EventComments } from '../components/events/EventComments.js'
import { profilePath } from '../utils/slug.js'
import { toSlug } from '../utils/slug.js'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: event, isLoading } = useEvent(id!)
  const contentRef = useRef<HTMLDivElement>(null)
  const commentsRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>

  useEffect(() => {
    if (!event || !contentRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.event-detail-item', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'expo.out',
      })
    }, contentRef)
    return () => ctx.revert()
  }, [event])

  function scrollToComments() {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <p className="font-display text-[var(--text-muted)] text-xl">Evento no encontrado</p>
        <Link to="/events">
          <Button variant="outline" size="md">Ver todos los eventos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Cover */}
      {event.cover && (
        <div className="relative w-full overflow-hidden" style={{ height: 'min(55vw, 520px)' }}>
          <img
            src={event.cover}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.55)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 55%)' }}
          />
        </div>
      )}

      <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-12">
        {/* Date + Title */}
        <div className="event-detail-item flex flex-col gap-2 mb-8">
          <p className="font-sans text-sm text-[var(--accent)] capitalize">{formatDate(event.date)}</p>
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            {event.title}
          </h1>
          {event.location && (
            <p className="font-sans text-sm text-[var(--text-muted)]">{event.location}</p>
          )}
        </div>

        {/* Social bar */}
        <div className="event-detail-item mb-8">
          <EventSocialBar eventId={event.id} onCommentClick={scrollToComments} />
        </div>

        {/* Description */}
        {event.description && (
          <p className="event-detail-item font-sans text-base text-[var(--text)] leading-relaxed mb-10">
            {event.description}
          </p>
        )}

        {/* Artist */}
        {event.profile && (
          <div className="event-detail-item flex items-center gap-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-10">
            {event.profile.avatar ? (
              <img
                src={event.profile.avatar}
                alt={event.profile.artistName}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0">
                <span className="font-display text-xl text-[var(--text-muted)]">
                  {event.profile.artistName.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">Artista</p>
              <Link
                to={profilePath(toSlug(event.profile.artistName), event.profile.id)}
                className="font-display font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors truncate"
              >
                {event.profile.artistName}
              </Link>
            </div>
            {event.profile.whatsapp && (
              <div className="ml-auto flex-shrink-0">
                <WhatsAppButton
                  number={event.profile.whatsapp}
                  message={`Hola ${event.profile.artistName}! Vi el evento "${event.title}" en DJPlatform y me interesa contactarte.`}
                  size="sm"
                />
              </div>
            )}
          </div>
        )}

        <div className="event-detail-item flex flex-wrap gap-3 mb-16">
          <Link to="/events">
            <Button variant="ghost" size="sm">Ver mas eventos</Button>
          </Link>
        </div>

        {/* Comments */}
        <div className="border-t border-[var(--border)] pt-10">
          <EventComments eventId={event.id} anchorRef={commentsRef} />
        </div>
      </div>
    </div>
  )
}
