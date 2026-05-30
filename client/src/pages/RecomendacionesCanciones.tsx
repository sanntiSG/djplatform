import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { useRecommendedSongs } from '../hooks/useRecommendations.js'
import { profilePath, toSlug } from '../utils/slug.js'
import { DURATION, EASE, revealStagger, prefersReducedMotion } from '../utils/motion.js'
import { getMediaThumbnail } from '../utils/mediaThumbnail.js'
import { useTapAnim } from '../hooks/useTapAnim.js'

gsap.registerPlugin(ScrollTrigger)

function SongCard({ song }: { song: import('../hooks/useRecommendations.js').RecommendedSong }) {
  const { ref, tapHandlers } = useTapAnim<HTMLAnchorElement>(0.95)
  const thumbnail = getMediaThumbnail(song.platform, song.embedId, song.thumbnailUrl)

  return (
    <Link
      ref={ref}
      to={`${profilePath(toSlug(song.artistName), String(song.profileId))}#${String(song.mediaId)}`}
      {...tapHandlers}
      className="rec-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        background: 'var(--surface-2, rgba(255,255,255,0.04))',
        borderRadius: 14,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--surface-3, rgba(255,255,255,0.07))',
        }}
      >
        {thumbnail && (
          <img src={thumbnail} alt={song.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.title ?? song.platform}
        </p>
        <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.artistName}
        </p>
      </div>
    </Link>
  )
}

export default function RecomendacionesCanciones() {
  const { data: songs, isLoading } = useRecommendedSongs(20)
  const pageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pageRef.current || prefersReducedMotion()) return
    gsap.fromTo(pageRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut })
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el || !songs?.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('.rec-card')
    const st = revealStagger(cards, el, { y: 20, stagger: 0.035 })
    return () => st.kill()
  }, [songs?.length])

  return (
    <div ref={pageRef} style={{ maxWidth: 720, margin: '0 auto', padding: 'calc(var(--header-h, 72px) + 24px) 20px 48px', minHeight: '100dvh' }}>
      <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
        Canciones recomendadas
      </h1>
      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 28px' }}>
        Basado en tus gustos y generos favoritos
      </p>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: 'var(--surface-2, rgba(255,255,255,0.04))', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!isLoading && (!songs?.length) && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            Guarda canciones para ver recomendaciones
          </p>
          <Link to="/profiles" style={{ display: 'inline-block', marginTop: 16, padding: '10px 22px', borderRadius: 999, background: 'var(--accent)', color: 'var(--bg)', fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Explorar artistas
          </Link>
        </div>
      )}

      {!isLoading && songs && songs.length > 0 && (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {songs.map((song) => (
            <SongCard key={`${song.profileId}-${String(song.mediaId)}`} song={song} />
          ))}
        </div>
      )}
    </div>
  )
}
