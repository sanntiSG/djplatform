/**
 * LibraryNowPlaying
 * Fullscreen "Now Playing" overlay — chrome only (title, controls, close).
 * Audio and the actual embed iframe live in SharedPlayerIframe (Biblioteca.tsx).
 *
 * Z-index layers (from bottom to top):
 *   z-55  dark background (this component)
 *   z-60  SharedPlayerIframe (the actual embed, centered)
 *   z-65  this component's transparent chrome wrapper
 *
 * Controls in expanded view:
 *   - Minimize (chevron down) — collapses back to mini-player
 *   - Previous / Next — skip tracks
 *   - NO play/pause button — user uses native controls from YouTube/Spotify/SoundCloud
 */
import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { usePlayerStore } from '../../store/usePlayerStore.js'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import { useTapAnim } from '../../hooks/useTapAnim.js'

/* ── Icons ────────────────────────────────────────────────── */

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

function CtrlBtn({ onClick, label, children }: {
  onClick: () => void
  label: string
  children: React.ReactNode
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
        background: 'none',
        border: 'none',
        color: 'var(--text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.18s ease',
      }}
    >
      {children}
    </button>
  )
}

/* ── Main component ───────────────────────────────────────── */

export function LibraryNowPlaying() {
  const { expanded, current, next, prev, setExpanded } = usePlayerStore()
  const item = current()

  const bgRef     = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const bg     = bgRef.current
    const chrome = chromeRef.current
    if (!bg || prefersReducedMotion()) {
      setExpanded(false)
      closingRef.current = false
      return
    }
    gsap.to([bg, chrome], {
      opacity: 0,
      y: 32,
      duration: DURATION.base,
      ease: EASE.softIn,
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
    const bg     = bgRef.current
    const chrome = chromeRef.current
    if (!bg || prefersReducedMotion()) return
    gsap.fromTo([bg, chrome], { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.softOut })
  }, [expanded])

  // Lock body scroll
  useEffect(() => {
    if (!expanded) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  // Escape + popstate to close
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.history.pushState({ nowPlaying: true }, '')
    const onPop = () => handleClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [expanded, handleClose])

  if (!expanded || !item) return null

  // ── Dark background layer (z-55) ───────────────────────────────
  const background = (
    <div
      ref={bgRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: 'var(--bg)',
      }}
    />
  )

  // ── Chrome layer (z-65, transparent middle so iframe at z-60 shows) ──
  const chrome = (
    <div
      ref={chromeRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Reproduciendo: ${item.title ?? item.artistName}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none', // clicks fall through to SharedPlayerIframe below
      }}
    >
      {/* Top bar — opaque, clickable */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          background: 'var(--bg)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label="Minimizar"
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
          <p style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Reproduciendo ahora
          </p>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Embed area — transparent placeholder (SharedPlayerIframe sits here at z-60) */}
      <div style={{ flex: 1 }} />

      {/* Bottom chrome — opaque, clickable */}
      <div
        style={{
          pointerEvents: 'auto',
          background: 'var(--bg)',
          flexShrink: 0,
        }}
      >
        {/* Track info */}
        <div style={{ padding: '8px 28px 12px', textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.title ?? item.platform}
          </p>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.artistName}
          </p>
        </div>

        {/* Transport controls — only prev/next, NO play/pause (use native embed controls) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '8px 28px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        }}>
          <CtrlBtn label="Anterior" onClick={prev}><PrevIcon /></CtrlBtn>
          <CtrlBtn label="Siguiente" onClick={next}><NextIcon /></CtrlBtn>
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      {background}
      {chrome}
    </>,
    document.body,
  )
}
