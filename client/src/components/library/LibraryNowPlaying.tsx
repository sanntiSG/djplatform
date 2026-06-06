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
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { usePlayerStore } from '../../store/usePlayerStore.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import { useTapAnim } from '../../hooks/useTapAnim.js'
import { profilePath, toSlug } from '../../utils/slug.js'
import { LikeButton } from '../ui/LikeButton.js'
import { SaveButton } from '../ui/SaveButton.js'
import { useProfileContentSocial, useToggleContentLike } from '../../hooks/useContentSocial.js'
import { useIsSaved, useToggleSaveMedia } from '../../hooks/useSavedMedia.js'
import type { SavedMediaItem } from '../../services/savedMediaService.js'

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

/* ── Like + Save buttons — only shown in recommendations context ── */

/**
 * Renders Me gusta and Guardar for the currently playing song.
 * Uses the same hooks and components as the artist profile, so state is
 * automatically synced across the app via React Query's cache.
 *
 * Rendered only when source === 'recommendations' (see Tarea 4 plan).
 * NOT rendered in Biblioteca context — songs there are already saved.
 */
function RecommendationsPlayerActions({ item }: { item: SavedMediaItem }) {
  const { user } = useAuthStore()
  const { data: socialMap } = useProfileContentSocial(item.profileId)
  const socialEntry = socialMap?.[`media:${item.mediaId}`]

  const isLiked    = socialEntry?.isLiked ?? false
  const likeCount  = socialEntry?.likeCount ?? 0
  const isSaved    = useIsSaved(item.mediaId)

  const { mutate: toggleLike, isPending: liking } = useToggleContentLike(
    item.profileId, 'media', item.mediaId,
  )
  const { mutate: toggleSave, isPending: saving } = useToggleSaveMedia(
    item.profileId, item.mediaId,
  )

  if (!user) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '6px 28px 14px',
      }}
    >
      <LikeButton
        isLiked={isLiked}
        likeCount={likeCount}
        onToggle={() => toggleLike()}
        disabled={liking}
        size="md"
        layout="column"
      />
      <SaveButton
        isSaved={isSaved}
        onToggle={() => toggleSave()}
        disabled={saving}
        size="md"
        layout="column"
      />
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */

export function LibraryNowPlaying() {
  const { expanded, current, next, prev, setExpanded, source } = usePlayerStore()
  const item = current()
  const navigate = useNavigate()

  const bgRef            = useRef<HTMLDivElement>(null)
  const chromeRef        = useRef<HTMLDivElement>(null)
  const artistRef        = useRef<HTMLButtonElement>(null)
  const arrowRef         = useRef<SVGSVGElement>(null)
  const closingRef       = useRef(false)
  /** Tracks whether we pushed a history entry that hasn't been consumed by popstate yet */
  const hasHistoryEntry  = useRef(false)

  /** Animate out and optionally run a callback after the exit (e.g., navigate) */
  const animateClose = useCallback(
    (onComplete?: () => void) => {
      if (closingRef.current) return
      closingRef.current = true
      const bg     = bgRef.current
      const chrome = chromeRef.current
      if (!bg || prefersReducedMotion()) {
        setExpanded(false)
        closingRef.current = false
        onComplete?.()
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
          onComplete?.()
        },
      })
    },
    [setExpanded],
  )

  const handleClose = useCallback(() => animateClose(), [animateClose])

  /** Navigate to the artist's profile — closes the player first */
  const handleNavigateToArtist = useCallback(() => {
    if (!item) return
    const url = profilePath(toSlug(item.artistName), item.profileId)
    animateClose(() => navigate(url))
  }, [item, animateClose, navigate])

  /* Artist button hover — subtle GSAP brightness + arrow shift */
  const handleArtistEnter = useCallback(() => {
    if (prefersReducedMotion()) return
    if (artistRef.current) {
      gsap.to(artistRef.current, {
        color: 'var(--text)',
        duration: DURATION.micro,
        ease: EASE.out,
      })
    }
    if (arrowRef.current) {
      gsap.to(arrowRef.current, { x: 3, opacity: 0.8, duration: DURATION.micro, ease: EASE.out })
    }
  }, [])

  const handleArtistLeave = useCallback(() => {
    if (prefersReducedMotion()) return
    if (artistRef.current) {
      gsap.to(artistRef.current, {
        color: 'var(--text-muted)',
        duration: DURATION.micro,
        ease: EASE.out,
      })
    }
    if (arrowRef.current) {
      gsap.to(arrowRef.current, { x: 0, opacity: 0.4, duration: DURATION.micro, ease: EASE.out })
    }
  }, [])

  const { ref: artistBtnRef, tapHandlers: artistTapHandlers } = useTapAnim<HTMLButtonElement>(0.95)

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
  // Also manages the history entry: pushState on open, back() if closed by chevron
  // so the native "back" gesture only needs ONE press to leave the page.
  useEffect(() => {
    if (!expanded) return
    window.history.pushState({ nowPlaying: true }, '')
    hasHistoryEntry.current = true

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    const onPop = () => {
      // Popstate = native back consumed the entry; no need to call history.back() on cleanup
      hasHistoryEntry.current = false
      handleClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
      // If the view was closed by chevron/Escape (not by popstate), the pushState entry
      // is still in the history stack. Pop it so one back gesture exits the page.
      if (hasHistoryEntry.current) {
        hasHistoryEntry.current = false
        window.history.back()
      }
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
          {/* Artist name — navigates to artist profile on tap */}
          <button
            ref={(el) => {
              ;(artistRef as React.MutableRefObject<HTMLButtonElement | null>).current = el
              ;(artistBtnRef as React.MutableRefObject<HTMLButtonElement | null>).current = el
            }}
            type="button"
            onClick={handleNavigateToArtist}
            onPointerEnter={handleArtistEnter}
            onPointerDown={artistTapHandlers.onPointerDown}
            onPointerUp={artistTapHandlers.onPointerUp}
            onPointerCancel={artistTapHandlers.onPointerCancel}
            onPointerLeave={() => { artistTapHandlers.onPointerLeave(); handleArtistLeave() }}
            aria-label={`Ver perfil de ${item.artistName}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 14,
              color: 'var(--text-muted)',
              margin: '4px auto 0',
              maxWidth: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.artistName}
            </span>
            {/* Subtle arrow — communicates interactivity without text */}
            <svg
              ref={arrowRef}
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ opacity: 0.4, flexShrink: 0 }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Transport controls — only prev/next, NO play/pause (use native embed controls) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '8px 28px',
          paddingBottom: source === 'recommendations' ? '8px' : 'calc(28px + env(safe-area-inset-bottom, 0px))',
        }}>
          <CtrlBtn label="Anterior" onClick={prev}><PrevIcon /></CtrlBtn>
          <CtrlBtn label="Siguiente" onClick={next}><NextIcon /></CtrlBtn>
        </div>

        {/* Me gusta / Guardar — solo en contexto de canciones recomendadas */}
        {source === 'recommendations' && (
          <div style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}>
            <RecommendationsPlayerActions item={item} />
          </div>
        )}
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
