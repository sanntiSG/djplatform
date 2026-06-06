/**
 * RecomendacionesCanciones — lista de canciones recomendadas con reproductor inline.
 *
 * Al tocar una canción se activa el mini reproductor (mismo que Biblioteca → Canciones),
 * reutilizando SharedPlayerIframe + LibraryPlayerBar + LibraryNowPlaying sin modificarlos.
 * Al salir de la página el reproductor se cierra (mismo comportamiento que Biblioteca).
 *
 * La navegacion al perfil del artista YA NO ocurre al hacer click directo en una cancion:
 * se accede desde la vista maximizada del reproductor (Tarea 3).
 */

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { useRecommendedSongs, type RecommendedSong } from '../hooks/useRecommendations.js'
import { DURATION, EASE, revealStagger, prefersReducedMotion } from '../utils/motion.js'
import { getMediaThumbnail } from '../utils/mediaThumbnail.js'
import { useTapAnim } from '../hooks/useTapAnim.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { LibraryPlayerBar } from '../components/library/LibraryPlayerBar.js'
import { LibraryNowPlaying } from '../components/library/LibraryNowPlaying.js'
import { SharedPlayerIframe } from '../components/library/SharedPlayerIframe.js'
import type { SavedMediaItem } from '../services/savedMediaService.js'

gsap.registerPlugin(ScrollTrigger)

/* ── Helpers ──────────────────────────────────────────────── */

/** Convierte RecommendedSong al formato SavedMediaItem que espera usePlayerStore */
function toSavedMediaItem(s: RecommendedSong): SavedMediaItem {
  return {
    _id: `rec-${String(s.profileId)}-${String(s.mediaId)}`,
    mediaId: String(s.mediaId),
    profileId: String(s.profileId),
    savedAt: '',
    artistName: s.artistName,
    avatar: s.avatar,
    title: s.title,
    platform: s.platform,
    thumbnailUrl: s.thumbnailUrl,
    embedId: s.embedId,
    type: s.type,
    genres: s.genres,
  }
}

/* ── Play icon ────────────────────────────────────────────── */

function PlayIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

/* ── SongCard ─────────────────────────────────────────────── */

function SongCard({
  song,
  queue,
  queueIndex,
}: {
  song: RecommendedSong
  queue: SavedMediaItem[]
  queueIndex: number
}) {
  const { ref, tapHandlers } = useTapAnim<HTMLButtonElement>(0.95)
  const thumbnail = getMediaThumbnail(song.platform, song.embedId, song.thumbnailUrl)

  const { current, isPlaying, playQueue, togglePlay } = usePlayerStore()
  const activeItem = current()
  const isActive = Boolean(
    activeItem &&
    activeItem.profileId === String(song.profileId) &&
    activeItem.mediaId === String(song.mediaId),
  )
  const canPlay = Boolean(song.embedId)

  const handleClick = useCallback(() => {
    if (!canPlay) return
    if (isActive) {
      togglePlay()
    } else {
      playQueue(queue, queueIndex)
    }
  }, [isActive, canPlay, togglePlay, playQueue, queue, queueIndex])

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      {...tapHandlers}
      className="rec-card"
      disabled={!canPlay}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        background: isActive
          ? 'rgba(212,255,0,0.07)'
          : 'var(--surface-2, rgba(255,255,255,0.04))',
        borderRadius: 14,
        textAlign: 'left',
        width: '100%',
        border: 'none',
        cursor: canPlay ? 'pointer' : 'default',
        outline: isActive ? '1px solid rgba(212,255,0,0.18)' : 'none',
        transition: 'background 0.22s ease, outline-color 0.22s ease',
      }}
    >
      {/* Thumbnail with play/pause overlay when active */}
      <div
        style={{
          position: 'relative',
          width: 52,
          height: 52,
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--surface-3, rgba(255,255,255,0.07))',
        }}
      >
        {thumbnail && (
          <img
            src={thumbnail}
            alt={song.title ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        )}
        {/* Play/pause indicator overlay when active */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            {isPlaying ? <PauseIconSmall /> : <PlayIconSmall />}
          </div>
        )}
      </div>

      {/* Song info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: isActive ? 'var(--accent)' : 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.22s ease',
          }}
        >
          {song.title ?? song.platform}
        </p>
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
          {song.artistName}
        </p>
      </div>

      {/* Right indicator: playing bars when active */}
      {isActive && (
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 16,
            flexShrink: 0,
          }}
        >
          {[1, 2, 3].map((b) => (
            <div
              key={b}
              style={{
                width: 3,
                borderRadius: 2,
                background: 'var(--accent)',
                height: isPlaying ? `${[60, 100, 75][b - 1]}%` : '30%',
                transition: 'height 0.3s ease',
                animation: isPlaying ? `equalizer-${b} 0.8s ease-in-out infinite alternate` : 'none',
              }}
            />
          ))}
        </div>
      )}
    </button>
  )
}

/* ── Page ─────────────────────────────────────────────────── */

export default function RecomendacionesCanciones() {
  const { data: songs, isLoading } = useRecommendedSongs(20)
  const { close: closePlayer } = usePlayerStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build the queue once songs are loaded (memoized by reference stability of songs array)
  const queue: SavedMediaItem[] = (songs ?? []).map(toSavedMediaItem)

  // Page enter animation
  useEffect(() => {
    if (!pageRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      pageRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut },
    )
  }, [])

  // Stagger reveal on first load
  useEffect(() => {
    const el = listRef.current
    if (!el || !songs?.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('.rec-card')
    const st = revealStagger(cards, el, { y: 20, stagger: 0.035 })
    return () => st.kill()
  }, [songs?.length])

  // Close player when leaving this page (same as Biblioteca)
  useEffect(() => {
    return () => { closePlayer() }
  }, [closePlayer])

  return (
    <div
      ref={pageRef}
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'calc(var(--header-h, 72px) + 24px) 20px 120px',
        minHeight: '100dvh',
      }}
    >
      <h1
        style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}
      >
        Canciones recomendadas
      </h1>
      <p
        style={{
          fontFamily: 'Satoshi, sans-serif',
          fontSize: 13,
          color: 'var(--text-muted)',
          margin: '0 0 28px',
        }}
      >
        Basado en tus gustos y generos favoritos
      </p>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 76,
                borderRadius: 14,
                background: 'var(--surface-2, rgba(255,255,255,0.04))',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !songs?.length && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: '1.1rem',
              color: 'var(--text-muted)',
            }}
          >
            Guarda canciones para ver recomendaciones
          </p>
          <Link
            to="/profiles"
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '10px 22px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bg)',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Explorar artistas
          </Link>
        </div>
      )}

      {/* Song list */}
      {!isLoading && songs && songs.length > 0 && (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {songs.map((song, i) => (
            <SongCard
              key={`${String(song.profileId)}-${String(song.mediaId)}`}
              song={song}
              queue={queue}
              queueIndex={i}
            />
          ))}
        </div>
      )}

      {/* Player UI — portals into document.body, same as Biblioteca */}
      <SharedPlayerIframe />
      <LibraryPlayerBar />
      <LibraryNowPlaying />
    </div>
  )
}
