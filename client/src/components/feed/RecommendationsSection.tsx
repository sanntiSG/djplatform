import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRecommendedSongs, useRecommendedArtists } from '../../hooks/useRecommendations.js'
import { useTapAnim } from '../../hooks/useTapAnim.js'
import { revealStagger, DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { profilePath, toSlug } from '../../utils/slug.js'

gsap.registerPlugin(ScrollTrigger)

/* ─────────── Platform icons ─────────── */

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    youtube: '#ff0000',
    soundcloud: '#ff5500',
    spotify: '#1db954',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors[platform] ?? 'var(--text-muted)',
        flexShrink: 0,
      }}
    />
  )
}

/* ─────────── Song card ─────────── */

function SongRecCard({ song }: { song: import('../../hooks/useRecommendations.js').RecommendedSong }) {
  const { ref, tapHandlers } = useTapAnim<HTMLAnchorElement>(0.94)
  const to = profilePath(toSlug(song.artistName), String(song.profileId))

  return (
    <Link
      ref={ref}
      to={to}
      {...tapHandlers}
      className="rec-card"
      style={{
        flexShrink: 0,
        width: 'clamp(130px, 36vw, 160px)',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--surface-2, rgba(255,255,255,0.06))',
          position: 'relative',
        }}
      >
        {song.thumbnailUrl ? (
          <img
            src={song.thumbnailUrl}
            alt={song.title ?? song.platform}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: 'var(--text-muted)',
            }}
          >
            <PlatformDot platform={song.platform} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
          }}
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {song.title ?? song.platform}
        </p>
        <p
          style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 11,
            color: 'var(--text-muted)',
            margin: '2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <PlatformDot platform={song.platform} />
          {song.artistName}
        </p>
      </div>
    </Link>
  )
}

/* ─────────── Artist card ─────────── */

function ArtistRecCard({ artist }: { artist: import('../../hooks/useRecommendations.js').RecommendedArtist }) {
  const { ref, tapHandlers } = useTapAnim<HTMLAnchorElement>(0.94)
  const to = profilePath(toSlug(artist.artistName), String(artist.profileId))

  return (
    <Link
      ref={ref}
      to={to}
      {...tapHandlers}
      className="rec-card"
      style={{
        flexShrink: 0,
        width: 'clamp(130px, 36vw, 160px)',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--surface-2, rgba(255,255,255,0.06))',
        }}
      >
        {artist.avatar ? (
          <img
            src={artist.avatar}
            alt={artist.artistName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            {artist.artistName[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artist.artistName}
        </p>
        {artist.genres?.length > 0 && (
          <p
            style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 10,
              color: 'var(--text-muted)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {artist.genres.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

/* ─────────── Sub-section row ─────────── */

function RecRow({
  kicker,
  title,
  viewMoreTo,
  children,
  isEmpty,
}: {
  kicker: string
  title: string
  viewMoreTo: string
  children: React.ReactNode
  isEmpty: boolean
}) {
  if (isEmpty) return null

  return (
    <div>
      {/* Section head — matches feed SectionHead style */}
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
        <Link
          to={viewMoreTo}
          className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 pb-0.5 flex items-center gap-1 flex-shrink-0"
        >
          Ver mas ›
        </Link>
      </div>

      {/* Mobile: horizontal scroll / Desktop: 5-col grid */}
      <div className="mt-4">
        <div
          className="md:hidden"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            paddingInline: 16,
            paddingBottom: 4,
          }}
        >
          {children}
        </div>
        <div
          className="hidden md:grid px-6"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────── Main export ─────────── */

export function RecommendationsSection() {
  const { data: songs, isLoading: songsLoading } = useRecommendedSongs(5)
  const { data: artists, isLoading: artistsLoading } = useRecommendedArtists(5)
  const sectionRef = useRef<HTMLElement>(null)
  const didReveal = useRef(false)

  const hasSongs = (songs?.length ?? 0) > 0
  const hasArtists = (artists?.length ?? 0) > 0
  const hasAny = hasSongs || hasArtists
  const isLoading = songsLoading || artistsLoading

  useEffect(() => {
    const el = sectionRef.current
    if (!el || didReveal.current || !hasAny || prefersReducedMotion()) return

    didReveal.current = true
    const cards = el.querySelectorAll('.rec-card')
    const st = revealStagger(cards, el, { y: 28, stagger: 0.03, start: 'top 88%' })
    return () => st.kill()
  }, [hasAny])

  if (isLoading || !hasAny) return null

  return (
    <section ref={sectionRef} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <RecRow
        kicker="Basado en tus gustos"
        title="Canciones recomendadas"
        viewMoreTo="/recomendaciones/canciones"
        isEmpty={!hasSongs}
      >
        {songs?.map((song) => (
          <SongRecCard key={`${song.profileId}-${String(song.mediaId)}`} song={song} />
        ))}
      </RecRow>

      <RecRow
        kicker="Artistas que te pueden gustar"
        title="Artistas recomendados"
        viewMoreTo="/recomendaciones/artistas"
        isEmpty={!hasArtists}
      >
        {artists?.map((artist) => (
          <ArtistRecCard key={String(artist.profileId)} artist={artist} />
        ))}
      </RecRow>
    </section>
  )
}
