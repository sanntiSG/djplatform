/**
 * LibraryNowPlaying
 * Fullscreen viewer that mirrors the profile publication viewer look.
 * Mounts when expanded===true in usePlayerStore.
 * The embed here is the "large" version; the hidden iframe in LibraryPlayerBar
 * is suspended while this is open to avoid double audio.
 */
import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { usePlayerStore } from '../../store/usePlayerStore.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import { useTapAnim } from '../../hooks/useTapAnim.js'

/* ── Icons ────────────────────────────────────────────────── */

function PlayIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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
        background: large ? 'rgba(255,255,255,0.1)' : 'none',
        border: 'none',
        color: 'var(--text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: large ? 56 : 44,
        height: large ? 56 : 44,
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.18s ease',
      }}
    >
      {children}
    </button>
  )
}

/* ── Platform embed ───────────────────────────────────────── */

function LargeEmbed({
  platform,
  embedId,
  title,
}: {
  platform: string
  embedId: string | undefined
  title?: string
}) {
  if (!embedId) return null

  if (platform === 'youtube') {
    return (
      <div
        className="w-full max-w-3xl mx-auto"
        style={{ aspectRatio: '16/9', borderRadius: 20, overflow: 'hidden' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&playsinline=1&rel=0`}
          title={title ?? 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    )
  }

  if (platform === 'spotify') {
    return (
      <div className="w-full max-w-xl mx-auto" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <iframe
          src={`https://open.spotify.com/embed/track/${embedId}?utm_source=generator&theme=0`}
          title={title ?? 'Spotify'}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ width: '100%', height: 352, border: 'none', borderRadius: 16 }}
        />
      </div>
    )
  }

  return null
}

/* ── Main component ───────────────────────────────────────── */

export function LibraryNowPlaying() {
  const { expanded, current, isPlaying, togglePlay, next, prev, setExpanded } = usePlayerStore()
  const item = current()
  const overlayRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const el = overlayRef.current
    if (!el || prefersReducedMotion()) {
      setExpanded(false)
      closingRef.current = false
      return
    }
    gsap.to(el, {
      opacity: 0,
      y: 40,
      duration: 0.28,
      ease: 'expo.in',
      onComplete: () => {
        setExpanded(false)
        closingRef.current = false
      },
    })
  }, [setExpanded])

  // Entrance animation
  useEffect(() => {
    if (!expanded) return
    closingRef.current = false
    const el = overlayRef.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.32, ease: 'expo.out' })
  }, [expanded])

  // Lock body scroll
  useEffect(() => {
    if (!expanded) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  // Escape + popstate
  useEffect(() => {
    if (!expanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.history.pushState({ nowPlaying: true }, '')
    function onPop() { handleClose() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [expanded, handleClose])

  if (!expanded || !item) return null

  const canPlay = item.platform !== 'soundcloud' && Boolean(item.embedId)

  const overlay = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Reproduciendo: ${item.title ?? item.artistName}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label="Cerrar visor"
          onClick={handleClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronDownIcon />
        </button>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Reproduciendo ahora
          </p>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Embed */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 20px',
          overflow: 'hidden',
        }}
      >
        {canPlay ? (
          <LargeEmbed
            key={`${item.profileId}-${item.mediaId}`}
            platform={item.platform}
            embedId={item.embedId}
            title={item.title}
          />
        ) : (
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              padding: 40,
              borderRadius: 20,
              background: 'var(--surface-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              Plataforma no compatible
            </p>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: 0, opacity: 0.6 }}>
              La reproduccion de SoundCloud no esta disponible en el reproductor interno.
            </p>
          </div>
        )}
      </div>

      {/* Track info */}
      <div
        style={{
          padding: '8px 28px 12px',
          flexShrink: 0,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title ?? item.platform}
        </p>
        <p
          style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 14,
            color: 'var(--text-muted)',
            margin: '4px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.artistName}
        </p>
      </div>

      {/* Transport controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '8px 28px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
          flexShrink: 0,
        }}
      >
        <CtrlBtn label="Anterior" onClick={prev}>
          <PrevIcon />
        </CtrlBtn>

        <CtrlBtn
          label={isPlaying ? 'Pausa' : 'Reproducir'}
          onClick={() => canPlay && togglePlay()}
          large
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </CtrlBtn>

        <CtrlBtn label="Siguiente" onClick={next}>
          <NextIcon />
        </CtrlBtn>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
