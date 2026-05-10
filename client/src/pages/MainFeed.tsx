import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProfiles } from '../hooks/useProfile.js'
import { useEventsFeed } from '../hooks/useEvents.js'
import { profilePath, eventPath } from '../utils/slug.js'
import { cn } from '../utils/cn.js'
import { prefersReducedMotion } from '../utils/motion.js'
import type { ReactNode } from 'react'
import type { ProfileResponse, EventResponse } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

const TYPE_LABEL: Record<string, string> = { dj: 'DJ', producer: 'Prod', other: 'Art' }

const FILTER_PILLS = ['Todos', 'Techno', 'House', 'Reggaeton', 'Cumbia', 'Drum & Bass', 'Ambient']

function AvailRing() {
  return (
    <span
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        boxShadow: '0 0 0 2px rgba(212,255,0,0.5)',
        animation: 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  )
}

function DJSlot({ profile }: { profile: ProfileResponse }) {
  return (
    <Link
      to={profilePath(profile.slug, profile.id)}
      className="dj-slot flex-shrink-0 flex flex-col items-center gap-2.5 group"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="relative" style={{ width: 78, height: 78 }}>
        <div
          className="w-full h-full rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.04]"
          style={{
            border: `2px solid ${
              profile.availability === 'available'
                ? 'rgba(212,255,0,0.55)'
                : 'rgba(255,255,255,0.08)'
            }`,
          }}
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.artistName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-[var(--border)]">
                {profile.artistName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        {profile.availability === 'available' && <AvailRing />}
        {profile.availability === 'available' && (
          <span
            className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg)]"
            style={{ background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.7)' }}
          />
        )}
      </div>
      <span
        className="font-sans text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-200 text-center leading-tight"
        style={{ maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {profile.artistName}
      </span>
    </Link>
  )
}

function EditorialCard({ event }: { event: EventResponse }) {
  return (
    <Link
      to={eventPath(event.slug, event.id)}
      className="editorial-card group relative flex-shrink-0 rounded-[22px] overflow-hidden block"
      style={{ width: 'clamp(262px, 76vw, 310px)', height: 460, scrollSnapAlign: 'start' }}
    >
      <div className="absolute inset-0">
        {event.cover ? (
          <img
            src={event.cover}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(155deg, #0d0d1a 0%, #141428 45%, #190a2e 100%)' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.5) 58%, rgba(0,0,0,0.95) 100%)',
          }}
        />
      </div>

      {/* Top: artist pill */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
        {event.profile && (
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 flex-1 min-w-0"
            style={{
              background: 'rgba(8,8,10,0.56)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            {event.profile.avatar ? (
              <img
                src={event.profile.avatar}
                alt={event.profile.artistName}
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--surface-elevated)] flex-shrink-0 flex items-center justify-center">
                <span className="text-[9px] font-display text-[var(--text-muted)]">
                  {event.profile.artistName.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-sans text-xs text-white/85 font-medium truncate">
              {event.profile.artistName}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: date (editorial) + title */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
          {formatDateShort(event.date)}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        <h3
          className="font-display font-bold text-white leading-[1.02] tracking-tight"
          style={{ fontSize: 'clamp(1.2rem, 5vw, 1.65rem)' }}
        >
          {event.title}
        </h3>
      </div>
    </Link>
  )
}

function PosterCard({ profile }: { profile: ProfileResponse }) {
  return (
    <Link
      to={profilePath(profile.slug, profile.id)}
      className="poster-card group relative flex-shrink-0 rounded-2xl overflow-hidden block"
      style={{ width: 'clamp(172px, 40vw, 210px)', height: 296, scrollSnapAlign: 'start' }}
    >
      <div className="absolute inset-0">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.artistName}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center">
            <span className="font-display font-bold text-5xl text-[var(--border)]">
              {profile.artistName.charAt(0)}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 38%, rgba(0,0,0,0.9) 100%)' }}
        />
      </div>

      <div className="absolute top-3 left-3">
        <span
          className="font-sans font-bold text-[9px] uppercase tracking-[0.18em] rounded-full px-2 py-0.5"
          style={{
            background: 'rgba(212,255,0,0.14)',
            color: '#d4ff00',
            border: '1px solid rgba(212,255,0,0.22)',
          }}
        >
          {TYPE_LABEL[profile.type] ?? profile.type}
        </span>
      </div>

      {profile.availability === 'available' && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{
            background: 'rgba(8,8,10,0.58)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#34d399', animation: 'pulse-ring 2s ease-in-out infinite' }}
          />
          <span className="font-sans text-[9px] text-white/70 font-medium">Activo</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-display font-bold text-white text-sm leading-tight truncate tracking-tight">
          {profile.artistName}
        </h3>
        {profile.location && (
          <p className="font-sans text-[10px] text-white/45 mt-0.5 truncate">{profile.location}</p>
        )}
        {profile.genres.length > 0 && (
          <p className="font-sans text-[10px] text-white/35 mt-1 truncate">
            {profile.genres.slice(0, 3).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

function SectionHead({
  kicker,
  title,
  href,
}: {
  kicker: string
  title: string
  href?: string
}) {
  return (
    <div className="feed-section-head flex items-end justify-between px-4 md:px-6">
      <div>
        <p className="font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] mb-1">
          {kicker}
        </p>
        <h2
          className="font-display font-semibold text-[var(--text)] tracking-tight"
          style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          to={href}
          className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 pb-0.5 flex items-center gap-1 flex-shrink-0"
        >
          Ver todo
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  )
}

function HScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`no-scrollbar flex gap-3.5 overflow-x-auto pb-1 px-4 md:px-6 ${className}`}
      style={{ scrollSnapType: 'x proximity' }}
    >
      {children}
    </div>
  )
}

function MosaicGrid({ profiles }: { profiles: ProfileResponse[] }) {
  const items = profiles.slice(0, 4)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    if (!window.matchMedia('(hover: hover)').matches) return
    if (prefersReducedMotion()) return

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.mosaic-card'))
    const cleanups = cards.map((card) => {
      const rxTo = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' })
      const ryTo = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' })
      const onEnter = () => gsap.set(card, { transformPerspective: 800 })
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        ryTo(((e.clientX - r.left) / r.width - 0.5) * 12)
        rxTo(-((e.clientY - r.top) / r.height - 0.5) * 12)
      }
      const onLeave = () => { rxTo(0); ryTo(0) }
      card.addEventListener('mouseenter', onEnter)
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      return () => {
        card.removeEventListener('mouseenter', onEnter)
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
        gsap.set(card, { rotateX: 0, rotateY: 0 })
      }
    })
    return () => cleanups.forEach((fn) => fn())
  }, [items.length])

  if (items.length < 2) return null

  const cardBase = 'group relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface)] mosaic-card'
  const imgClass = 'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]'
  const overlay = 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%)'

  function CardInner({ profile }: { profile: ProfileResponse }) {
    return (
      <Link to={profilePath(profile.slug, profile.id)} className="block w-full h-full">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.artistName} className={imgClass} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-elevated)]">
            <span className="font-display font-bold text-6xl text-[var(--border)]">
              {profile.artistName.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: overlay }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-sans font-bold text-[9px] uppercase tracking-[0.18em] text-[var(--accent)] mb-1">
            {TYPE_LABEL[profile.type] ?? profile.type}
          </p>
          <h3 className="font-display font-bold text-white text-sm leading-tight tracking-tight truncate">
            {profile.artistName}
          </h3>
          {profile.location && (
            <p className="font-sans text-[10px] text-white/40 mt-0.5 truncate">{profile.location}</p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="px-4 md:px-6">
      <div ref={gridRef} className="grid grid-cols-2 gap-3" style={{ gridAutoRows: '140px' }}>
        {/* Card 0: tall (spans 2 rows) */}
        <div className={cardBase} style={{ gridRow: 'span 2' }}>
          <CardInner profile={items[0]} />
        </div>
        {/* Card 1 */}
        {items[1] && (
          <div className={cardBase}>
            <CardInner profile={items[1]} />
          </div>
        )}
        {/* Card 2 */}
        {items[2] && (
          <div className={cardBase}>
            <CardInner profile={items[2]} />
          </div>
        )}
        {/* Card 3: full width */}
        {items[3] && (
          <div className={`${cardBase} col-span-2`} style={{ height: 160 }}>
            <CardInner profile={items[3]} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function MainFeed() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [activeGenre, setActiveGenre] = useState('Todos')

  const djsQuery = useProfiles({ availability: 'available' })
  const profilesQuery = useProfiles({})
  const eventsQuery = useEventsFeed()

  const allDJs = djsQuery.data?.pages[0] ?? []
  const featuredProfiles = profilesQuery.data?.pages[0]?.slice(0, 10) ?? []
  const featuredEvents = eventsQuery.data?.pages[0]?.slice(0, 8) ?? []

  const availableDJs = allDJs
    .filter((p) =>
      activeGenre === 'Todos'
        ? true
        : p.genres.some((g) => g.toLowerCase().includes(activeGenre.toLowerCase())),
    )
    .slice(0, 14)

  const mosaicProfiles = featuredProfiles.slice(0, 4)

  const isReady = !djsQuery.isLoading && !profilesQuery.isLoading && !eventsQuery.isLoading
  const hasContent = allDJs.length > 0 || featuredEvents.length > 0 || featuredProfiles.length > 0

  useEffect(() => {
    if (!isReady || !pageRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dj-slot',
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.045, ease: 'expo.out', delay: 0.2 },
      )

      gsap.utils.toArray<HTMLElement>('.feed-section-head').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          },
        )
      })

      gsap.fromTo(
        '.editorial-card',
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.075,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.editorial-section', start: 'top 84%' },
        },
      )

      gsap.fromTo(
        '.poster-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.065,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.profiles-section', start: 'top 84%' },
        },
      )

      gsap.fromTo(
        '.mosaic-card',
        { opacity: 0, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.mosaic-section', start: 'top 80%' },
        },
      )
    }, pageRef)

    return () => ctx.revert()
  }, [isReady])

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--bg)] md:pt-16">

      {/* ─── PAGE HEADER ─────────────────────────────────── */}
      <div className="px-4 md:px-6 pb-6 pt-safe md:pt-10">
        {/* Kicker row — search icon on mobile (hamburger already top-right) */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
            Escena electronica argentina
          </p>
          <Link
            to="/profiles"
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
            }}
            aria-label="Buscar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>
        </div>

        <h1
          className="font-display font-semibold text-[var(--text)] leading-[0.97] tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 4.5rem)' }}
        >
          Descubri
          <br />
          <span className="text-[var(--text-muted)]">la escena.</span>
        </h1>
      </div>

      {/* ─── GENRE FILTER PILLS ───────────────────────────── */}
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:px-6 pb-8"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setActiveGenre(pill)}
            className={cn(
              'flex-shrink-0 font-sans font-medium text-xs rounded-full px-4 py-2 border transition-all duration-200',
              activeGenre === pill
                ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/25 hover:text-[var(--text)]',
            )}
          >
            {pill}
          </button>
        ))}
      </div>

      {!isReady && (
        <div className="flex items-center justify-center py-24">
          <span className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isReady && hasContent && (
        <div className="flex flex-col gap-14 pb-24">

          {/* DJs disponibles */}
          {allDJs.length > 0 && (
            <section>
              <SectionHead
                kicker="Disponibles ahora"
                title="DJs en escena"
                href="/profiles?availability=available"
              />
              {availableDJs.length > 0 ? (
                <HScroll className="mt-5">
                  {availableDJs.map((profile) => (
                    <DJSlot key={profile.id} profile={profile} />
                  ))}
                </HScroll>
              ) : (
                <p className="px-4 md:px-6 mt-4 font-sans text-sm text-[var(--text-muted)]">
                  No hay DJs con ese genero disponibles ahora.
                </p>
              )}
            </section>
          )}

          {/* Proximos eventos */}
          {featuredEvents.length > 0 && (
            <section className="editorial-section">
              <SectionHead kicker="Proximos eventos" title="Lo que se viene" href="/events" />
              <HScroll className="mt-5">
                {featuredEvents.map((event) => (
                  <EditorialCard key={event.id} event={event} />
                ))}
              </HScroll>
            </section>
          )}

          {/* Perfiles destacados */}
          {featuredProfiles.length > 0 && (
            <section className="profiles-section">
              <SectionHead kicker="Artistas" title="Perfiles destacados" href="/profiles" />
              <HScroll className="mt-5">
                {featuredProfiles.map((profile) => (
                  <PosterCard key={profile.id} profile={profile} />
                ))}
              </HScroll>
            </section>
          )}

          {/* Mosaico — asymmetric grid on sm+ */}
          {mosaicProfiles.length >= 2 && (
            <section className="mosaic-section">
              <SectionHead kicker="Explora" title="Escena completa" href="/profiles" />
              <div className="mt-5">
                <MosaicGrid profiles={mosaicProfiles} />
              </div>
            </section>
          )}

        </div>
      )}

      {isReady && !hasContent && (
        <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5 px-6 text-center">
          <p className="font-display text-[var(--text-muted)] text-2xl tracking-tight">
            La escena se esta construyendo.
          </p>
          <p className="font-sans text-sm text-[var(--text-muted)] max-w-[280px] leading-relaxed">
            Se el primero en crear tu perfil de DJ o publicar un evento.
          </p>
          <div className="flex gap-3 flex-wrap justify-center pt-2">
            <Link
              to="/auth/register"
              className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Crear perfil
            </Link>
            <Link
              to="/events/new"
              className="px-6 py-2.5 rounded-full font-sans text-sm text-[var(--text)] border border-[var(--border)] hover:border-white/20 transition-colors"
            >
              Publicar evento
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
