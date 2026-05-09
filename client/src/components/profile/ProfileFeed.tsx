import { useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { buildFeed } from '../../utils/profileFeed.js'
import { useProfileContentSocial } from '../../hooks/useContentSocial.js'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '../../utils/motion.js'
import type { ProfileResponse, EventResponse, MediaItem } from '../../types/index.js'

gsap.registerPlugin(ScrollTrigger)

interface ProfileFeedProps {
  profile: ProfileResponse
  events: EventResponse[]
  isLoading?: boolean
  onItemClick: (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => void
}

function SkeletonTile() {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-elevated)]">
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  )
}

function StatBadge({ count, icon }: { count: number; icon: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 font-sans font-medium text-white" style={{ fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
      {icon}
      {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
    </span>
  )
}

const HeartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const BubbleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
  </svg>
)

function MediaTile({ item }: { item: MediaItem }) {
  if (item.platform === 'youtube' && item.embedId) {
    return (
      <img
        src={`https://i.ytimg.com/vi/${item.embedId}/hqdefault.jpg`}
        alt={item.title ?? 'Video'}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
    )
  }
  const platformColor = item.platform === 'spotify' ? '#1ed760' : '#ff5500'
  const platformLabel = item.platform === 'spotify' ? 'Spotify' : 'SoundCloud'
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 p-4"
      style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.9), ${platformColor}22)` }}
    >
      <span className="font-sans font-semibold text-white/40" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {platformLabel}
      </span>
      {item.title && (
        <p className="font-display font-semibold text-white text-center leading-tight" style={{ fontSize: 13 }}>
          {item.title}
        </p>
      )}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: platformColor + '22', border: `1px solid ${platformColor}44` }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={platformColor}>
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
    </div>
  )
}

function EventTile({ event }: { event: EventResponse }) {
  const date = new Date(event.date)
  const shortDate = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return (
    <>
      {event.cover ? (
        <img
          src={event.cover}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface-elevated))' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 p-2.5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }}
      >
        <p className="font-sans font-medium text-white leading-tight" style={{ fontSize: 11 }}>
          {event.title}
        </p>
        <p className="font-sans text-white/60" style={{ fontSize: 9 }}>{shortDate}</p>
      </div>
    </>
  )
}

const KIND_ICONS = {
  photo: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  media: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  event: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
}

export function ProfileFeed({ profile, events, isLoading, onItemClick }: ProfileFeedProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const feed = buildFeed(profile, events)

  const { data: socialMap } = useProfileContentSocial(profile.id)

  const animateTiles = useCallback(() => {
    if (!gridRef.current || prefersReducedMotion()) return
    gsap.from('.feed-tile', {
      opacity: 0,
      y: 18,
      duration: DURATION.enter,
      stagger: STAGGER.base,
      ease: EASE.out,
      clearProps: 'opacity,y',
      scrollTrigger: {
        trigger: gridRef.current,
        start: 'top 88%',
        once: true,
      },
    })
  }, [])

  useEffect(() => {
    if (!gridRef.current || feed.length === 0) return
    const ctx = gsap.context(animateTiles, gridRef)
    return () => ctx.revert()
  }, [feed.length, animateTiles])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px sm:gap-1 lg:gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-sans text-sm text-[var(--text-muted)]">Sin contenido publicado todavia.</p>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px sm:gap-1 lg:gap-1.5"
    >
      {feed.map((item, i) => {
        const socialKey = item.kind !== 'event' ? `${item.kind}:${item.id}` : null
        const stats = socialKey ? socialMap?.[socialKey] : null

        return (
          <div
            key={`${item.kind}-${i}`}
            className="feed-tile relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-[var(--surface-elevated)] cursor-pointer group"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              onItemClick({ kind: item.kind, id: item.id }, rect)
            }}
          >
            {item.kind === 'photo' && (
              <img
                src={item.data.url}
                alt="Foto"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            )}
            {item.kind === 'media' && <MediaTile item={item.data} />}
            {item.kind === 'event' && <EventTile event={item.data} />}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

            {/* Stats overlay — always visible on mobile, hover-only on sm+ */}
            {stats && (
              <div
                className="absolute bottom-0 left-0 right-0 px-2.5 py-2 flex items-center gap-3
                  opacity-100 sm:opacity-0 sm:translate-y-1
                  sm:group-hover:opacity-100 sm:group-hover:translate-y-0
                  transition-all duration-200 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
              >
                <StatBadge count={stats.likeCount} icon={<HeartIcon />} />
                <StatBadge count={stats.commentCount} icon={<BubbleIcon />} />
              </div>
            )}

            {/* Kind badge */}
            <div
              className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center
                opacity-20 group-hover:opacity-90 transition-opacity duration-200 pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}
            >
              {KIND_ICONS[item.kind]}
            </div>
          </div>
        )
      })}
    </div>
  )
}
