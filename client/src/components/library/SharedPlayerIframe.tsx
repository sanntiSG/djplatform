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
 * • Expanded → iframe scales up to full visible size (clip-path reveal, GSAP).
 *   z-index 60, above the NowPlaying background (z-55) but below its chrome (z-65).
 *
 * YouTube first-tap fix
 * ─────────────────────
 * Listens for the YouTube IFrame API onReady postMessage.
 * If the user tapped play before the player loaded, queues the command
 * and fires it the moment the player is ready.
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

type Platform = 'youtube' | 'spotify'

function getExpandedSize(platform: Platform, vw: number) {
  if (platform === 'youtube') {
    const w = Math.min(vw - 40, 700)
    return { width: w, height: Math.round(w * 9 / 16) }
  }
  return { width: Math.min(vw - 40, 500), height: 352 }
}

/* ── component ──────────────────────────────────────────────────── */

export function SharedPlayerIframe() {
  const { current, isPlaying, expanded } = usePlayerStore()
  const item = current()

  const containerRef = useRef<HTMLDivElement>(null)
  const isReadyRef   = useRef(false)
  const isPlayingRef = useRef(isPlaying)
  const initializedRef = useRef(false)

  // Sync isPlaying ref so async callbacks always see the latest value
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])

  /* ── initial hidden state (once per mount) ────────────────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.set(el, {
      xPercent: -50,
      yPercent: -50,
      clipPath: 'inset(50% round 16px)',
      opacity: 0,
      zIndex: -1,
      pointerEvents: 'none',
    })
    initializedRef.current = true
  }, [])

  /* ── animate expand / collapse ────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el || !initializedRef.current) return

    if (expanded && item) {
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
      gsap.killTweensOf(el)
      if (prefersReducedMotion()) {
        gsap.set(el, { clipPath: 'inset(50% round 16px)', opacity: 0, zIndex: -1, pointerEvents: 'none' })
      } else {
        gsap.to(el, {
          clipPath: 'inset(42% round 16px)',
          opacity: 0,
          scale: 0.92,
          duration: DURATION.base,
          ease: EASE.softIn,
          onComplete: () => gsap.set(el, { zIndex: -1, pointerEvents: 'none', scale: 1 }),
        })
      }
    }
  }, [expanded]) // only fires when expanded changes; track changes handled by iframe remount

  /* ── YouTube: listen for onReady to fix first-tap ────────── */
  useEffect(() => {
    if (!item || item.platform !== 'youtube') return
    isReadyRef.current = false

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(typeof e.data === 'string' ? e.data : '{}') as { event?: string }
        if (data.event === 'onReady') {
          isReadyRef.current = true
          // Fire queued play command if the user tapped before the player loaded
          if (isPlayingRef.current) {
            const iframe = containerRef.current?.querySelector('iframe')
            iframe?.contentWindow?.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
              '*',
            )
          }
        }
      } catch { /* ignore */ }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [item?.mediaId]) // re-run when track changes

  /* ── YouTube: play / pause control ───────────────────────── */
  useEffect(() => {
    if (!item || item.platform !== 'youtube') return
    if (!isReadyRef.current) return // wait for onReady
    const iframe = containerRef.current?.querySelector('iframe')
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: isPlaying ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    )
  }, [isPlaying, item])

  /* ── render guard ─────────────────────────────────────────── */
  if (!item) return null
  const canPlay = item.platform !== 'soundcloud' && Boolean(item.embedId)
  if (!canPlay) return null

  // Spotify: keep remount-on-play behaviour (no pause API in embeds)
  if (item.platform === 'spotify' && !isPlaying && !expanded) return null

  const itemKey = `${item.profileId}-${item.mediaId}`
  const platform = item.platform as Platform
  const br = platform === 'youtube' ? 20 : 16

  const embedSrc = platform === 'youtube'
    ? `https://www.youtube.com/embed/${item.embedId}?enablejsapi=1&autoplay=1&playsinline=1&rel=0`
    : `https://open.spotify.com/embed/track/${item.embedId}?utm_source=generator&theme=0`

  return createPortal(
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        overflow: 'hidden',
        borderRadius: br,
        // GSAP controls: xPercent, yPercent, width, height, clipPath, opacity, zIndex, pointerEvents
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
