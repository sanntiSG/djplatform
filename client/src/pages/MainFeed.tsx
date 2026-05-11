import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProfiles } from '../hooks/useProfile.js'
import { useEventsFeed } from '../hooks/useEvents.js'
import { profilePath, eventPath } from '../utils/slug.js'
import { cn } from '../utils/cn.js'
import { prefersReducedMotion, magneticHover, tiltCard } from '../utils/motion.js'
import { genreToColor, stringToColor, COLOR_VAR } from '../utils/colors.js'
import { RainbowPill } from '../components/ui/RainbowPill.js'
import { NumberedListItem } from '../components/ui/NumberedListItem.js'
import { ColorBlockCard } from '../components/ui/ColorBlockCard.js'
import { CommentCard } from '../components/ui/CommentCard.js'
import type { ReactNode } from 'react'
import type { ProfileResponse, EventResponse } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

/* ── Utils ──────────────────────────────────────────────── */

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function hashInt(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h)
}

const TYPE_LABEL: Record<string, string> = { dj: 'DJ', producer: 'Prod', other: 'Art' }

const FILTER_GENRES = [
  'Todos', 'Techno', 'House', 'Deep House', 'Reggaeton',
  'Cumbia', 'Drum & Bass', 'Ambient', 'Trance',
]

/* ── Sub-components ─────────────────────────────────────── */

function AvailRing() {
  return (
    <span
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        boxShadow: '0 0 0 2px rgba(212,255,0,0.5)',
        animation: 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
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
          className="w-full h-full rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.06]"
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
              <span className="font-display font-bold text-2xl" style={{ color: 'var(--border)' }}>
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
  const cardRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el || !window.matchMedia('(hover: hover)').matches || prefersReducedMotion()) return
    return tiltCard(el, 5)
  }, [])

  return (
    <Link
      ref={cardRef}
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
            style={{
              background: `linear-gradient(155deg, ${COLOR_VAR[stringToColor(event.title)]} 0%, #0d0d1a 100%)`,
            }}
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

      {event.profile && (
        <div className="absolute top-4 left-4 right-4">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 w-fit"
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
            <span className="font-sans text-xs text-white/85 font-medium truncate max-w-[140px]">
              {event.profile.artistName}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="font-display font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
          {formatDateShort(event.date)}{event.location ? ` · ${event.location}` : ''}
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
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
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

function TrendingCard({ event, rank }: { event: EventResponse; rank: number }) {
  const color = stringToColor(event.title)
  return (
    <Link
      to={eventPath(event.slug, event.id)}
      className="trending-card group relative overflow-hidden rounded-[var(--radius-md)] block"
      style={{ height: 148 }}
    >
      {event.cover ? (
        <img
          src={event.cover}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          style={{ filter: 'brightness(0.52) contrast(1.12)' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${COLOR_VAR[color]} 0%, rgba(8,8,10,1) 100%)`,
            opacity: 0.75,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.75))' }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between p-3">
        <span
          className="font-display font-bold leading-none select-none"
          style={{
            fontSize: '2.2rem',
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '-0.05em',
          }}
        >
          {rank}
        </span>
        <div>
          <p className="font-display font-semibold text-white text-sm leading-tight tracking-tight line-clamp-2">
            {event.title}
          </p>
          {event.location && (
            <p className="font-sans text-[10px] text-white/50 mt-0.5 truncate">{event.location}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

function NewsFeedRow({ event }: { event: EventResponse }) {
  const color = stringToColor(event.title)
  return (
    <Link
      to={eventPath(event.slug, event.id)}
      className="news-row group flex items-center gap-4 py-3.5 border-b transition-colors duration-200"
      style={{ borderColor: 'var(--border)' }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.12)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'
      }}
    >
      <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0">
        {event.cover ? (
          <img
            src={event.cover}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.1]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${COLOR_VAR[color]}, rgba(8,8,10,0.9))`,
            }}
          />
        )}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display font-semibold text-sm text-[var(--text)] truncate leading-tight tracking-tight">
          {event.title}
        </span>
        {event.profile && (
          <span className="font-sans text-xs text-[var(--text-muted)] truncate">
            {event.profile.artistName}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
        <span className="font-sans text-[10px] text-[var(--text-muted)]">
          {formatDateShort(event.date)}
        </span>
        {event.location && (
          <span
            className="font-sans text-[10px] text-[var(--text-muted)] truncate"
            style={{ maxWidth: 80 }}
          >
            {event.location}
          </span>
        )}
      </div>
    </Link>
  )
}

/* ── Main Page ──────────────────────────────────────────── */

export default function MainFeed() {
  const pageRef = useRef<HTMLDivElement>(null)
  const musicLibRef = useRef<HTMLElement>(null)
  const djsRef = useRef<HTMLElement>(null)
  const trendingRef = useRef<HTMLElement>(null)
  const topDJsRef = useRef<HTMLElement>(null)
  const editorialRef = useRef<HTMLElement>(null)
  const genreCardsRef = useRef<HTMLElement>(null)
  const spotlightRef = useRef<HTMLElement>(null)
  const newsRef = useRef<HTMLElement>(null)
  const ctaPillRef = useRef<HTMLDivElement>(null)

  const [activeGenre, setActiveGenre] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFloatingCTA, setShowFloatingCTA] = useState(false)

  const djsQuery = useProfiles({ availability: 'available' })
  const profilesQuery = useProfiles({})
  const eventsQuery = useEventsFeed()

  const allDJs = djsQuery.data?.pages[0] ?? []
  const featuredProfiles = profilesQuery.data?.pages[0]?.slice(0, 10) ?? []
  const featuredEvents = eventsQuery.data?.pages[0]?.slice(0, 8) ?? []

  const filteredDJs = allDJs
    .filter((p) => {
      const matchGenre =
        activeGenre === 'Todos' ||
        p.genres.some((g) => g.toLowerCase().includes(activeGenre.toLowerCase()))
      const matchSearch =
        !searchQuery ||
        p.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchGenre && matchSearch
    })
    .slice(0, 14)

  const topDJs = featuredProfiles.slice(0, 8)
  const trendingEvents = featuredEvents.slice(0, 4)
  const newsEvents = featuredEvents.slice(1, 5)
  const spotlightProfile = featuredProfiles.find(
    (p) => p.bio && p.bio.length > 40,
  )

  const isReady = !djsQuery.isLoading && !profilesQuery.isLoading && !eventsQuery.isLoading
  const hasContent =
    allDJs.length > 0 || featuredEvents.length > 0 || featuredProfiles.length > 0

  /* Floating CTA scroll trigger */
  useEffect(() => {
    const onScroll = () => setShowFloatingCTA(window.scrollY > 350)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const pill = ctaPillRef.current
    if (!pill) return
    gsap.to(pill, {
      y: showFloatingCTA ? 0 : 80,
      opacity: showFloatingCTA ? 1 : 0,
      duration: 0.42,
      ease: showFloatingCTA ? 'back.out(1.4)' : 'expo.in',
    })
  }, [showFloatingCTA])

  /* Main GSAP animations */
  useEffect(() => {
    if (!isReady || !pageRef.current) return
    const reduced = prefersReducedMotion()

    const ctx = gsap.context(() => {
      /* Hero header */
      if (!reduced) {
        gsap.from('.feed-hero-el', {
          y: 32,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          delay: 0.1,
        })
      }

      /* Music Library card */
      if (musicLibRef.current && !reduced) {
        gsap.fromTo(
          musicLibRef.current,
          { opacity: 0, y: 36, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: 'expo.out',
            scrollTrigger: { trigger: musicLibRef.current, start: 'top 86%', once: true },
          },
        )
        gsap.fromTo(
          '.rpill',
          { opacity: 0, scale: 0.82, y: 8 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.42,
            ease: 'back.out(1.7)',
            stagger: 0.038,
            delay: 0.18,
            scrollTrigger: { trigger: musicLibRef.current, start: 'top 86%', once: true },
          },
        )
      }

      /* DJs strip */
      if (djsRef.current && !reduced) {
        gsap.fromTo(
          '.dj-slot',
          { opacity: 0, x: -18 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.04,
            ease: 'expo.out',
            delay: 0.15,
            scrollTrigger: { trigger: djsRef.current, start: 'top 88%', once: true },
          },
        )
      }

      /* Trending grid */
      if (trendingRef.current && !reduced) {
        gsap.fromTo(
          '.trending-card',
          { opacity: 0, scale: 0.92, y: 22 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: 'expo.out',
            stagger: 0.07,
            scrollTrigger: { trigger: trendingRef.current, start: 'top 83%', once: true },
          },
        )
      }

      /* Top DJs ranked list — slide from right */
      if (topDJsRef.current && !reduced) {
        gsap.fromTo(
          '.nl-item',
          { opacity: 0, x: 44 },
          {
            opacity: 1,
            x: 0,
            duration: 0.52,
            ease: 'back.out(1.25)',
            stagger: 0.06,
            scrollTrigger: { trigger: topDJsRef.current, start: 'top 81%', once: true },
          },
        )
      }

      /* Editorial cards */
      if (editorialRef.current && !reduced) {
        gsap.fromTo(
          '.editorial-card',
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            stagger: 0.072,
            ease: 'expo.out',
            scrollTrigger: { trigger: editorialRef.current, start: 'top 84%', once: true },
          },
        )
      }

      /* Genre color-block cards */
      if (genreCardsRef.current && !reduced) {
        gsap.fromTo(
          '.cbcard',
          { opacity: 0, x: 28 },
          {
            opacity: 1,
            x: 0,
            duration: 0.58,
            ease: 'expo.out',
            stagger: 0.055,
            scrollTrigger: { trigger: genreCardsRef.current, start: 'top 84%', once: true },
          },
        )
      }

      /* Spotlight comment card */
      if (spotlightRef.current && !reduced) {
        gsap.fromTo(
          spotlightRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'expo.out',
            scrollTrigger: { trigger: spotlightRef.current, start: 'top 83%', once: true },
          },
        )
      }

      /* News feed rows */
      if (newsRef.current && !reduced) {
        gsap.fromTo(
          '.news-row',
          { opacity: 0, x: -18 },
          {
            opacity: 1,
            x: 0,
            duration: 0.44,
            ease: 'expo.out',
            stagger: 0.055,
            scrollTrigger: { trigger: newsRef.current, start: 'top 84%', once: true },
          },
        )
      }

      /* Section heads */
      gsap.utils.toArray<HTMLElement>('.feed-section-head').forEach((el) => {
        if (reduced) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.62,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        )
      })
    }, pageRef)

    /* Magnetic on floating CTA */
    const pilEl = ctaPillRef.current
    let cleanMag: (() => void) | undefined
    if (pilEl && window.matchMedia('(hover: hover)').matches && !reduced) {
      cleanMag = magneticHover(pilEl, 0.3)
    }

    return () => {
      ctx.revert()
      cleanMag?.()
    }
  }, [isReady])

  const handleGenreClick = useCallback((genre: string) => {
    setActiveGenre(genre)
    setSearchQuery('')
  }, [])

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--bg)] md:pt-16 overflow-x-hidden">

      {/* ─── PAGE HEADER ─────────────────────────────────── */}
      <div className="px-4 md:px-6 pb-6 pt-safe md:pt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="feed-hero-el font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
            Escena electronica argentina
          </p>
          <Link
            to="/profiles"
            className="feed-hero-el md:hidden w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
            aria-label="Buscar"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>
        </div>

        <h1
          className="feed-hero-el font-display font-semibold text-[var(--text)] leading-[0.97] tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 4.5rem)' }}
        >
          Descubri
          <br />
          <span className="text-[var(--text-muted)]">la escena.</span>
        </h1>
      </div>

      {/* ─── MUSIC LIBRARY CARD ───────────────────────────── */}
      <section ref={musicLibRef} className="px-4 md:px-6 pb-8">
        <div
          className="rounded-[var(--radius-xl)] overflow-hidden p-5"
          style={{
            background: 'linear-gradient(148deg, var(--surface-elevated) 0%, var(--surface) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className="font-display font-semibold text-[var(--text)] tracking-tight"
              style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}
            >
              Biblioteca musical
            </span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar DJs, generos, ciudades..."
              className="w-full font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] rounded-[var(--radius-md)] px-4 py-2.5 pr-10 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,255,0,0.3)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Rainbow genre pills */}
          <div className="flex flex-wrap gap-2">
            {FILTER_GENRES.map((genre) => (
              <RainbowPill
                key={genre}
                label={genre === 'Todos' ? 'Todos' : `#${genre.toLowerCase().replace(/\s+/g, '')}`}
                color={genre === 'Todos' ? 'teal' : genreToColor(genre)}
                active={activeGenre === genre}
                onClick={() => handleGenreClick(genre)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Loading */}
      {!isReady && (
        <div className="flex items-center justify-center py-24">
          <span className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isReady && hasContent && (
        <div className="flex flex-col gap-14 pb-32">

          {/* DJs en escena */}
          {allDJs.length > 0 && (
            <section ref={djsRef}>
              <SectionHead
                kicker="Disponibles ahora"
                title="DJs en escena"
                href="/profiles?availability=available"
              />
              {filteredDJs.length > 0 ? (
                <HScroll className="mt-5">
                  {filteredDJs.map((profile) => (
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

          {/* Trending Today */}
          {trendingEvents.length > 0 && (
            <section ref={trendingRef}>
              <SectionHead kicker="Esta semana" title="Trending" href="/events" />
              <div className="mt-5 px-4 md:px-6 grid grid-cols-2 gap-3">
                {trendingEvents.map((event, i) => (
                  <TrendingCard key={event.id} event={event} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* Top DJs ranked */}
          {topDJs.length > 0 && (
            <section ref={topDJsRef}>
              <SectionHead kicker="Escena" title="Top DJs" href="/profiles" />
              <div className="mt-5 px-4 md:px-6 flex flex-col gap-2">
                {topDJs.map((profile, i) => (
                  <NumberedListItem
                    key={profile.id}
                    rank={i + 1}
                    thumbUrl={profile.avatar}
                    title={profile.artistName}
                    subtitle={profile.genres.slice(0, 2).join(' · ')}
                    meta={profile.location}
                    color={genreToColor(profile.genres[0] ?? '')}
                    href={profilePath(profile.slug, profile.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Lo que se viene — editorial HScroll */}
          {featuredEvents.length > 0 && (
            <section ref={editorialRef} className="editorial-section">
              <SectionHead kicker="Proximos eventos" title="Lo que se viene" href="/events" />
              <HScroll className="mt-5">
                {featuredEvents.map((event) => (
                  <EditorialCard key={event.id} event={event} />
                ))}
              </HScroll>
            </section>
          )}

          {/* Eventos por genero — ColorBlockCards HScroll */}
          {featuredProfiles.length > 0 && (
            <section ref={genreCardsRef}>
              <SectionHead kicker="Por genero" title="Tu escena" />
              <HScroll className="mt-5">
                {FILTER_GENRES.filter((g) => g !== 'Todos').map((genre) => {
                  const count = featuredProfiles.filter((p) =>
                    p.genres.some((g2) => g2.toLowerCase().includes(genre.toLowerCase())),
                  ).length
                  return (
                    <div
                      key={genre}
                      style={{
                        width: 'clamp(170px, 42vw, 210px)',
                        height: 172,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <ColorBlockCard
                        color={genreToColor(genre)}
                        title={genre}
                        meta={count > 0 ? `${count} artista${count !== 1 ? 's' : ''}` : 'Explorar'}
                        className="h-full"
                        onClick={() => handleGenreClick(genre)}
                      />
                    </div>
                  )
                })}
              </HScroll>
            </section>
          )}

          {/* Spotlight — CommentCard from profile bio */}
          {spotlightProfile && (
            <section ref={spotlightRef} className="px-4 md:px-6">
              <SectionHead kicker="Voz de la escena" title="Destacado" />
              <div className="mt-5">
                <CommentCard
                  avatarUrl={spotlightProfile.avatar}
                  author={spotlightProfile.artistName}
                  role={TYPE_LABEL[spotlightProfile.type] ?? spotlightProfile.type}
                  text={
                    spotlightProfile.bio
                      ? spotlightProfile.bio.slice(0, 200) +
                        (spotlightProfile.bio.length > 200 ? '...' : '')
                      : ''
                  }
                  likes={(hashInt(spotlightProfile.id) % 80) + 12}
                />
              </div>
            </section>
          )}

          {/* News feed */}
          {newsEvents.length > 0 && (
            <section ref={newsRef} className="px-4 md:px-6">
              <SectionHead kicker="Ultimas noticias" title="Feed" href="/events" />
              <div className="mt-5">
                {newsEvents.map((event) => (
                  <NewsFeedRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {isReady && !hasContent && (
        <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5 px-6 text-center">
          <p className="font-display text-[var(--text-muted)] tracking-tight" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>
            La escena se esta construyendo.
          </p>
          <p className="font-sans text-sm text-[var(--text-muted)] max-w-[280px] leading-relaxed">
            Se el primero en crear tu perfil de DJ o publicar un evento.
          </p>
          <div className="flex gap-3 flex-wrap justify-center pt-2">
            <Link
              to="/auth/register"
              className="px-6 py-2.5 rounded-full font-sans font-semibold text-sm hover:opacity-85 transition-opacity"
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

      {/* ─── FLOATING CTA PILL ───────────────────────────── */}
      <div
        ref={ctaPillRef}
        className="fixed z-30 pb-safe"
        style={{
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%) translateY(80px)',
          opacity: 0,
        }}
      >
        <Link
          to="/auth/register"
          className="glass-pill flex items-center gap-2.5 px-5 py-3 rounded-full font-sans font-semibold text-sm text-[var(--text)] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] whitespace-nowrap"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
          />
          Publicar mi perfil
        </Link>
      </div>

    </div>
  )
}
