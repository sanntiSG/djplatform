/**
 * SharedPlayerIframe
 *
 * ONE iframe instance that persists for the active track across both
 * the mini-player and the full-screen "Now Playing" view.
 *
 * Problem it solves
 * ─────────────────
 * Previously there were two independent iframes (LibraryPlayerBar:HiddenEmbed
 * + LibraryNowPlaying:LargeEmbed). On expand the new iframe always started
 * from 0; on collapse audio restarted; double audio when both were playing.
 *
 * How it works
 * ─────────────
 * • Mini   → iframe is 1×1 px, opacity 0, z-index −1. Audio plays hidden.
 *            NO visible window opens when the user presses play.
 * • Expanded → iframe scales up to full visible size (clip-path reveal, GSAP).
 *   z-index 60, above the NowPlaying background (z-55) but below its chrome (z-65).
 * • Collapse → iframe goes back to hidden 1×1 px. Audio keeps playing
 *   uninterrupted — no pause, no restart.
 *
 * YouTube bidirectional sync
 * ──────────────────────────
 * Listens for the YouTube IFrame API onReady & onStateChange postMessages.
 * - onReady: fires any queued play command.
 * - onStateChange: syncs usePlayerStore.isPlaying with the real video state
 *   so native YouTube controls (inside expanded view) stay in sync with
 *   the mini-player buttons.
 *
 * Spotify note
 * ─────────────
 * Spotify embeds lack a public pause/seek API in direct-embed mode.
 * We keep the existing "remount on play" behaviour (returns null when
 * !isPlaying && !expanded) to trigger autoplay on mount.
 */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { usePlayerStore } from '../../store/usePlayerStore.js'
import { prefersReducedMotion, EASE, DURATION } from '../../utils/motion.js'

/* ── helpers ────────────────────────────────────────────────────── */

type Platform = 'youtube' | 'spotify' | 'soundcloud'

function getExpandedSize(platform: Platform, vw: number) {
  if (platform === 'youtube') {
    const w = Math.min(vw - 40, 700)
    return { width: w, height: Math.round(w * 9 / 16) }
  }
  if (platform === 'soundcloud') {
    return { width: Math.min(vw - 40, 600), height: 166 }
  }
  return { width: Math.min(vw - 40, 500), height: 352 }
}

/* YouTube onStateChange codes */
const YT_PLAYING = 1
const YT_PAUSED  = 2

/* ── component ──────────────────────────────────────────────────── */

export function SharedPlayerIframe() {
  const { current, isPlaying, expanded } = usePlayerStore()
  const item = current()

  const containerRef = useRef<HTMLDivElement>(null)
  const isReadyRef   = useRef(false)
  const isPlayingRef = useRef(isPlaying)
  /** Guard to prevent infinite loops when WE set isPlaying from YT callback */
  const suppressSyncRef = useRef(false)

  // Sync isPlaying ref so async callbacks always see the latest value
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  /* ── animate expand / collapse ────────────────────────────── */
  // NOTE: Initial hidden state is in the div's style prop (not GSAP) so it
  // applies from frame 1 — prevents the phantom iframe window on first play.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (expanded && item) {
      // EXPAND: make visible at full size
      const size = getExpandedSize(item.platform as Platform, window.innerWidth)
      gsap.killTweensOf(el)
      gsap.set(el, { zIndex: 60, width: size.width, height: size.height })

      if (prefersReducedMotion()) {
        gsap.set(el, { clipPath: 'inset(0% round 16px)', opacity: 1, scale: 1, pointerEvents: 'auto' })
      } else {
        gsap.fromTo(el,
          { clipPath: 'inset(42% round 16px)', opacity: 0, scale: 0.9 },
          {
            clipPath: 'inset(0% round 16px)',
            opacity: 1,
            scale: 1,
            pointerEvents: 'auto',
            duration: DURATION.enter,
            ease: EASE.softOut,
          },
        )
      }
    } else {
      // COLLAPSE: go back to hidden 1×1 — audio keeps playing
      gsap.killTweensOf(el)
      const hide = () => gsap.set(el, {
        zIndex: -1,
        pointerEvents: 'none',
        scale: 1,
        width: 1,
        height: 1,
        clipPath: 'inset(50% round 16px)',
        opacity: 0,
      })

      if (prefersReducedMotion()) {
        hide()
      } else {
        gsap.to(el, {
          clipPath: 'inset(42% round 16px)',
          opacity: 0,
          scale: 0.92,
          duration: DURATION.base,
          ease: EASE.softIn,
          onComplete: hide,
        })
      }
    }
  }, [expanded]) // only fires when expanded changes; track changes handled by iframe remount

  /* ── YouTube: listen for onReady + onStateChange ─────────── */
  useEffect(() => {
    if (!item || item.platform !== 'youtube') return
    isReadyRef.current = false

    const handleMessage = (e: MessageEvent) => {
      try {
        const raw = typeof e.data === 'string' ? e.data : ''
        if (!raw) return
        const data = JSON.parse(raw) as { event?: string; info?: number }

        if (data.event === 'onReady') {
          isReadyRef.current = true
        }

        // Sync isPlaying with native YouTube player state
        if (data.event === 'onStateChange' && typeof data.info === 'number') {
          const store = usePlayerStore.getState()
          if (data.info === YT_PLAYING && !store.isPlaying) {
            suppressSyncRef.current = true
            usePlayerStore.setState({ isPlaying: true })
            suppressSyncRef.current = false
          } else if (data.info === YT_PAUSED && store.isPlaying) {
            suppressSyncRef.current = true
            usePlayerStore.setState({ isPlaying: false })
            suppressSyncRef.current = false
          }
        }
      } catch { /* ignore non-JSON messages */ }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [item?.mediaId]) // re-run when track changes

  /* ── YouTube: play / pause control ───────────────────────── */
  // No isReadyRef guard — commands sent before YouTube loads are silently
  // ignored; autoplay=1 handles the initial play. By the time the user can
  // tap pause the player is always ready.
  useEffect(() => {
    if (suppressSyncRef.current) return
    if (!item || item.platform !== 'youtube') return
    const iframe = containerRef.current?.querySelector('iframe')
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: isPlaying ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    )
  }, [isPlaying, item])

  /* ── render guard ─────────────────────────────────────────── */
  if (!item) return null

  // SoundCloud: use embedHtml via a dedicated widget iframe if available
  const isSoundcloud = item.platform === 'soundcloud'
  const canPlay = isSoundcloud
    ? Boolean((item as any).embedHtml || item.embedId)
    : Boolean(item.embedId)
  if (!canPlay) return null

  // Spotify: keep remount-on-play behaviour (no pause API in embeds)
  if (item.platform === 'spotify' && !isPlaying && !expanded) return null

  const itemKey = `${item.profileId}-${item.mediaId}`
  const platform = item.platform as Platform
  const br = platform === 'youtube' ? 20 : 16

  let embedSrc: string | null = null
  if (platform === 'youtube') {
    embedSrc = `https://www.youtube.com/embed/${item.embedId}?enablejsapi=1&autoplay=1&playsinline=1&rel=0`
  } else if (platform === 'spotify') {
    embedSrc = `https://open.spotify.com/embed/track/${item.embedId}?utm_source=generator&theme=0`
  } else if (platform === 'soundcloud') {
    // SoundCloud widget embed
    const scUrl = item.embedId || ''
    embedSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`
  }

  if (!embedSrc) return null

  return createPortal(
    <div
      ref={containerRef}
      style={{
        // ── Initial hidden state applied from frame 1 (before GSAP fires) ──
        // Prevents the phantom iframe window appearing when the user taps play.
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1,
        height: 1,
        overflow: 'hidden',
        borderRadius: br,
        opacity: 0,
        zIndex: -1,
        pointerEvents: 'none',
        // GSAP then takes full control of: width, height, clipPath, opacity,
        // zIndex, pointerEvents, scale on each expand / collapse.
      }}
    >
      {/* key forces iframe remount on track change (new src + autoplay) */}
      <iframe
        key={itemKey}
        src={embedSrc}
        title={item.title ?? platform}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>,
    document.body,
  )
}
