/**
 * LibraryPlayerBar
 * Fixed bottom mini-player that appears while a saved song is active.
 * Reads / drives usePlayerStore; hosts the real embed iframe hidden behind
 * the thumbnail so audio plays without interruption.
 */
import { useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { usePlayerStore } from '../../store/usePlayerStore.js'
import { getMediaThumbnail } from '../../utils/mediaThumbnail.js'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import { useTapAnim } from '../../hooks/useTapAnim.js'

/* ── Icons ────────────────────────────────────────────────── */

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* ── Control button ───────────────────────────────────────── */

function CtrlBtn({
  onClick,
  label,
  children,
  large = false,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  large?: boolean
}) {
  const { ref, tapHandlers } = useTapAnim<HTMLButtonElement>(0.88)
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      {...tapHandlers}
      style={{
        background: large ? 'rgba(255,255,255,0.12)' : 'none',
        border: 'none',
        color: 'var(--text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: large ? 40 : 32,
        height: large ? 40 : 32,
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.18s ease',
      }}
    >
      {children}
    </button>
  )
}

// Audio playback is handled by SharedPlayerIframe (see Biblioteca.tsx)
// This component only manages the mini-player UI bar.

/* ── Main component ───────────────────────────────────────── */

export function LibraryPlayerBar() {
  const { current, isPlaying, togglePlay, next, prev, setExpanded, close } = usePlayerStore()
  const item = current()
  const barRef = useRef<HTMLDivElement>(null)

  // Slide in / out
  const hasItem = Boolean(item)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.style.transform = hasItem ? 'translateY(0)' : 'translateY(100%)'
      return
    }
    gsap.to(el, {
      y: hasItem ? 0 : '100%',
      duration: DURATION.enter,
      ease: hasItem ? EASE.softOut : EASE.softIn,
    })
  }, [hasItem])

  // When the track changes, reset the iframe key so it remounts with autoplay
  const thumbnail = item ? getMediaThumbnail(item.platform, item.embedId, item.thumbnailUrl) : null
  const canPlay = item ? (item.platform !== 'soundcloud' && Boolean(item.embedId)) : false

  const handlePlayPause = useCallback(() => {
    if (!canPlay) return
    togglePlay()
  }, [canPlay, togglePlay])

  if (!item) {
    return (
      <div
        ref={barRef}
        aria-hidden="true"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, transform: 'translateY(100%)', zIndex: 40 }}
      />
    )
  }

  const bar = (
    <div
      ref={barRef}
      role="region"
      aria-label="Reproductor"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(14,14,18,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        // pb-safe: respect iOS safe area
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--surface-3, rgba(255,255,255,0.07))',
          }}
        >
          {thumbnail ? (
            <img src={thumbnail} alt={item.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                {item.artistName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          {/* Audio lives in SharedPlayerIframe (Biblioteca.tsx) */}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title ?? item.platform}
          </p>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.artistName}
          </p>
          {!canPlay && (
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,80,80,0.7)', margin: '1px 0 0' }}>
              No disponible en reproductor
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CtrlBtn label="Anterior" onClick={prev}>
            <PrevIcon />
          </CtrlBtn>

          <CtrlBtn label={isPlaying ? 'Pausa' : 'Reproducir'} onClick={handlePlayPause} large>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </CtrlBtn>

          <CtrlBtn label="Siguiente" onClick={next}>
            <NextIcon />
          </CtrlBtn>

          <CtrlBtn label="Ver en grande" onClick={() => setExpanded(true)}>
            <ExpandIcon />
          </CtrlBtn>

          <CtrlBtn label="Cerrar reproductor" onClick={close}>
            <CloseIcon />
          </CtrlBtn>
        </div>
      </div>
    </div>
  )

  return createPortal(bar, document.body)
}
