/**
 * Trending — ranking unificado de eventos y canciones por me gustas.
 * Accesible solo desde el botón "Ver todo" del feed; no aparece en el navbar.
 *
 * Design plan (skillsgpt-tasteskill):
 *   seed = 72 % 5 = 2
 *   Component archs: chip-tab filters + ranked list rows + inline rank badge
 *   GSAP: stagger reveal on mount, timeline filter-transition on chip change
 *   Fonts: Clash Display (display) + Satoshi (body) — locked by .impeccable.md
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTrending } from '../hooks/useTrending.js'
import { getMediaThumbnail } from '../utils/mediaThumbnail.js'
import { profilePath, eventPath, toSlug } from '../utils/slug.js'
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion.js'
import type { TrendingItem } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

/* ── Types ──────────────────────────────────────────────── */

type FilterKind = 'all' | 'event' | 'song'

/* ── Helpers ─────────────────────────────────────────────── */

function itemHref(item: TrendingItem): string {
  if (item.kind === 'event') return eventPath(item.slug, item.id)
  return `${profilePath(toSlug(item.artistName), item.profileId)}#${item.mediaId}`
}

function itemTitle(item: TrendingItem): string {
  if (item.kind === 'event') return item.title
  return item.title ?? item.platform
}

function itemSub(item: TrendingItem): string | undefined {
  if (item.kind === 'event') return item.location
  return item.artistName
}

function itemCover(item: TrendingItem): string | undefined {
  if (item.kind === 'event') return item.cover
  return getMediaThumbnail(item.platform, item.embedId, item.thumbnailUrl)
}

/* ── Sub-components ──────────────────────────────────────── */

const CHIP_LABEL: Record<FilterKind, string> = {
  all: 'Todo',
  event: 'Eventos',
  song: 'Canciones',
}

function FilterChip({
  kind,
  active,
  onClick,
}: {
  kind: FilterKind
  active: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  const handlePointerDown = () => {
    if (!ref.current || prefersReducedMotion()) return
    gsap.to(ref.current, { scale: 0.94, duration: DURATION.tap, ease: EASE.softOut })
  }
  const handlePointerUp = () => {
    if (!ref.current || prefersReducedMotion()) return
    gsap.to(ref.current, { scale: 1, duration: DURATION.micro, ease: EASE.pop })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        fontFamily: 'Satoshi, sans-serif',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        padding: '7px 16px',
        borderRadius: 'var(--radius-xl)',
        border: active ? 'none' : '1px solid var(--border)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'color 180ms, background 180ms, border-color 180ms',
        letterSpacing: '0.01em',
        flexShrink: 0,
      }}
    >
      {CHIP_LABEL[kind]}
    </button>
  )
}

/** Heart icon + count */
function LikesBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'Satoshi, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count}
    </span>
  )
}

/** Small kind pill — "Evento" or "Cancion" */
function KindPill({ kind }: { kind: TrendingItem['kind'] }) {
  const isEvent = kind === 'event'
  return (
    <span
      style={{
        fontFamily: 'Satoshi, sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 'var(--radius-xl)',
        background: isEvent
          ? 'rgba(96,165,250,0.12)'
          : 'var(--c-pink-muted, rgba(244,114,182,0.12))',
        color: isEvent ? '#60a5fa' : 'var(--c-pink, #f472b6)',
        flexShrink: 0,
      }}
    >
      {isEvent ? 'Evento' : 'Cancion'}
    </span>
  )
}

/** Ranked row item */
function TrendingRow({
  item,
  rank,
  className = '',
}: {
  item: TrendingItem
  rank: number
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const cover = itemCover(item)

  const handlePointerEnter = () => {
    if (!ref.current || prefersReducedMotion()) return
    gsap.to(ref.current, {
      background: 'var(--surface-elevated)',
      duration: DURATION.micro,
      ease: EASE.out,
    })
  }
  const handlePointerLeave = () => {
    if (!ref.current || prefersReducedMotion()) return
    gsap.to(ref.current, {
      background: 'var(--surface)',
      duration: DURATION.micro,
      ease: EASE.out,
    })
  }

  return (
    <Link
      ref={ref}
      to={itemHref(item)}
      className={`trending-row ${className}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank number — ghost overlay */}
      <span
        aria-hidden="true"
        style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 700,
          fontSize: rank <= 9 ? '2rem' : '1.6rem',
          lineHeight: 1,
          color: 'rgba(255,255,255,0.07)',
          letterSpacing: '-0.05em',
          width: 36,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* Thumbnail */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--surface-elevated)',
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface))',
            }}
          />
        )}
      </div>

      {/* Title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {itemTitle(item)}
        </p>
        {itemSub(item) && (
          <p
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 12,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {itemSub(item)}
          </p>
        )}
      </div>

      {/* Right: likes + kind */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <KindPill kind={item.kind} />
        <LikesBadge count={item.likeCount} />
      </div>
    </Link>
  )
}

/* ── Page ────────────────────────────────────────────────── */

export default function Trending() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterKind>('all')
  const { items, isLoading } = useTrending()
  const listRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)

  const filtered = filter === 'all'
    ? items
    : items.filter((i) => i.kind === filter)

  /* Page enter animation */
  useEffect(() => {
    if (!pageRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut },
    )
  }, [])

  /* Stagger rows on first data load */
  useEffect(() => {
    if (!listRef.current || !items.length || prefersReducedMotion()) return
    const rows = listRef.current.querySelectorAll('.trending-row')
    gsap.fromTo(
      rows,
      { opacity: 0, y: 18, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: DURATION.enter,
        ease: EASE.softOut,
        stagger: 0.04,
      },
    )
  }, [items.length])

  /* Filter transition: fade out → apply → fade in stagger */
  const handleFilter = useCallback(
    (next: FilterKind) => {
      if (next === filter || isAnimating.current) return
      if (!listRef.current || prefersReducedMotion()) {
        setFilter(next)
        return
      }
      const rows = listRef.current.querySelectorAll('.trending-row')
      isAnimating.current = true

      gsap.to(rows, {
        opacity: 0,
        y: -10,
        scale: 0.97,
        duration: 0.18,
        ease: EASE.softIn,
        stagger: 0.02,
        onComplete: () => {
          setFilter(next)
          // Rows re-render; wait for paint then animate in
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const newRows = listRef.current?.querySelectorAll('.trending-row')
              if (!newRows) { isAnimating.current = false; return }
              gsap.fromTo(
                newRows,
                { opacity: 0, y: 16, scale: 0.97 },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: DURATION.base,
                  ease: EASE.softOut,
                  stagger: 0.035,
                  onComplete: () => { isAnimating.current = false },
                },
              )
            })
          })
        },
      })
    },
    [filter],
  )

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingTop: 'calc(var(--header-h, 72px) + 16px)',
        paddingBottom: 64,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* Back nav */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: 24,
            transition: 'color 180ms',
          }}
          onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
          onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              margin: '0 0 6px',
            }}
          >
            Esta semana
          </p>
          <h1
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Trending
          </h1>
        </div>

        {/* Filter chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            overflowX: 'auto',
          }}
          className="no-scrollbar"
        >
          {(['all', 'event', 'song'] as FilterKind[]).map((k) => (
            <FilterChip
              key={k}
              kind={k}
              active={filter === k}
              onClick={() => handleFilter(k)}
            />
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
            }}
          >
            <p
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
              }}
            >
              {filter === 'all'
                ? 'No hay contenido trending todavia'
                : filter === 'event'
                  ? 'No hay eventos trending'
                  : 'No hay canciones trending'}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div
            ref={listRef}
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {filtered.map((item, i) => (
              <TrendingRow
                key={item.kind === 'event' ? `e-${item.id}` : `s-${item.mediaId}`}
                item={item}
                rank={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
