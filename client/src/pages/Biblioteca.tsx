import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useSavedMediaList, useRemoveSavedMedia } from '../hooks/useSavedMedia.js'
import { useLikedProfiles } from '../hooks/useLikedProfiles.js'
import { useProfileLike } from '../hooks/useProfileSocial.js'
import { useSwipeToDelete } from '../hooks/useSwipeToDelete.js'
import { useTapAnim } from '../hooks/useTapAnim.js'
import { DURATION, EASE, STAGGER, prefersReducedMotion, revealStagger } from '../utils/motion.js'
import { profilePath, toSlug } from '../utils/slug.js'
import { getMediaThumbnail } from '../utils/mediaThumbnail.js'
import { usePlayerStore } from '../store/usePlayerStore.js'
import { LibraryPlayerBar } from '../components/library/LibraryPlayerBar.js'
import { LibraryNowPlaying } from '../components/library/LibraryNowPlaying.js'
import type { SavedMediaItem } from '../services/savedMediaService.js'
import type { LikedProfileItem } from '../hooks/useLikedProfiles.js'

/* ─────────────────────── Icons ─────────────────────── */

function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1C4.6 3 3.3 3 2.2 4.2 1.3 5 1 7 1 7S.7 9.3.7 11.5v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 22 12 22 12 22s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1C23.3 9.3 23 7 23 7zm-13.5 8.9V8.1l8.1 3.9-8.1 3.9z" />
    </svg>
  )
}

function SoundcloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 13.5c0 1.9 1.6 3.5 3.5 3.5h13c1.9 0 3.5-1.6 3.5-3.5 0-1.7-1.2-3.1-2.8-3.4.1-.4.1-.7.1-1.1C18.3 5.1 15.1 2 11.2 2 8.7 2 6.5 3.3 5.3 5.3 2.9 5.7 1 8.1 1 10.9v.2C1 11.4 1 12.5 1 13.5z" />
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path fill="black" d="M16.7 10.5c-2.5-1.5-6.5-1.6-8.8-.9-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.7-.8 7.1-.7 9.9 1.1.3.2.4.6.2.9-.3.3-.6.4-.9.3zm-.3 2.5c-.3.2-.6.2-.9 0-2.1-1.3-5.3-1.7-7.8-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 2.8-.9 6.4-.4 8.9 1.1.3.2.4.5.2.8v.2zm-.9 2.4c-.2.1-.5.1-.7-.1-1.8-1.1-4.1-1.3-6.8-.7-.3.1-.5-.1-.6-.4-.1-.3.1-.5.4-.6 2.9-.6 5.6-.4 7.6.8.3.2.4.5.1.8v.2z" />
    </svg>
  )
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'youtube') return <YoutubeIcon />
  if (platform === 'soundcloud') return <SoundcloudIcon />
  return <SpotifyIcon />
}

/* ─────────────────────── Contextual Menu ─────────────────────── */

interface MenuOption {
  label: string
  onClick: () => void
  danger?: boolean
}

function ContextMenu({
  options,
  anchorRect,
  onClose,
}: {
  options: MenuOption[]
  anchorRect: DOMRect
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = menuRef.current
    if (!el) return

    if (!prefersReducedMotion()) {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.92, y: -6 },
        { opacity: 1, scale: 1, y: 0, duration: DURATION.base, ease: EASE.softOut },
      )
      const items = el.querySelectorAll('[data-menu-item]')
      gsap.fromTo(
        items,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, stagger: STAGGER.tight, duration: DURATION.base, ease: EASE.softOut },
      )
    }

    const onClickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 160)
  const right = window.innerWidth - anchorRect.right

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top,
        right,
        zIndex: 200,
        minWidth: 180,
        background: 'var(--surface, rgba(28,28,32,0.96))',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '6px 0',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          data-menu-item
          type="button"
          onClick={() => { opt.onClick(); onClose() }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '11px 18px',
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: opt.danger ? '#ff4d4d' : 'var(--text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}

/* ─────────────────────── SavedSongCard ─────────────────────── */

function PlayOverlay({ onClick, isActive, isPlaying, canPlay }: {
  onClick: (e: React.MouseEvent) => void
  isActive: boolean
  isPlaying: boolean
  canPlay: boolean
}) {
  const { ref, tapHandlers } = useTapAnim<HTMLButtonElement>(0.9)
  if (!canPlay) {
    return (
      <div
        title="No disponible en reproductor"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0)',
          borderRadius: 10,
          cursor: 'not-allowed',
          opacity: 0.35,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
    )
  }
  return (
    <button
      ref={ref}
      type="button"
      aria-label={isActive && isPlaying ? 'Pausar' : 'Reproducir'}
      onClick={onClick}
      {...tapHandlers}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.18s ease',
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.45)' }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0)' }}
    >
      {isActive && isPlaying ? (
        /* Equalizer bars animation for "now playing" */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
          <rect x="2" y="6" width="4" height="12" rx="1">
            <animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="y" values="6;9;6" dur="0.8s" repeatCount="indefinite" />
          </rect>
          <rect x="10" y="4" width="4" height="16" rx="1">
            <animate attributeName="height" values="16;8;16" dur="0.65s" repeatCount="indefinite" />
            <animate attributeName="y" values="4;8;4" dur="0.65s" repeatCount="indefinite" />
          </rect>
          <rect x="18" y="8" width="4" height="8" rx="1">
            <animate attributeName="height" values="8;14;8" dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="y" values="8;5;8" dur="0.9s" repeatCount="indefinite" />
          </rect>
        </svg>
      ) : isActive ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      )}
    </button>
  )
}

function SavedSongCard({
  item,
  queue,
  queueIndex,
}: {
  item: SavedMediaItem
  queue: SavedMediaItem[]
  queueIndex: number
}) {
  const navigate = useNavigate()
  const heightRef = useRef<HTMLDivElement>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const { ref: btnRef, tapHandlers } = useTapAnim<HTMLButtonElement>(0.94)

  const { current, isPlaying, playQueue, togglePlay } = usePlayerStore()
  const activeItem = current()
  const isActive = Boolean(activeItem && activeItem.profileId === item.profileId && activeItem.mediaId === item.mediaId)
  const canPlay = item.platform !== 'soundcloud' && Boolean(item.embedId)

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isActive) {
      togglePlay()
    } else {
      playQueue(queue, queueIndex)
    }
  }, [isActive, togglePlay, playQueue, queue, queueIndex])

  const { mutate: remove, isPending } = useRemoveSavedMedia()

  const handleDelete = useCallback(() => {
    const el = heightRef.current
    if (!el || prefersReducedMotion()) {
      remove({ profileId: item.profileId, mediaId: item.mediaId })
      return
    }
    const h = el.getBoundingClientRect().height
    gsap.to(el, {
      height: h,
      duration: 0.01,
      onComplete: () => {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          duration: 0.28,
          ease: EASE.softIn,
          onComplete: () => remove({ profileId: item.profileId, mediaId: item.mediaId }),
        })
      },
    })
  }, [item.profileId, item.mediaId, remove])

  const { cardRef, panelRef, swipeHandlers } = useSwipeToDelete<HTMLDivElement, HTMLDivElement>({
    onDelete: handleDelete,
    disabled: isPending,
  })

  const menuOptions: MenuOption[] = [
    { label: 'Eliminar de guardados', onClick: handleDelete, danger: true },
    {
      label: 'Ver artista',
      onClick: () => navigate(profilePath(toSlug(item.artistName), item.profileId)),
    },
  ]

  const onLongPressStart = useCallback((e: React.PointerEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY }
    longPressTimer.current = setTimeout(() => {
      const el = e.currentTarget as HTMLElement
      setMenuAnchor(el.getBoundingClientRect())
    }, 450)
  }, [])

  const onLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const thumbnailUrl = getMediaThumbnail(item.platform, item.embedId, item.thumbnailUrl)
  const title = item.title ?? item.platform

  return (
    <div ref={heightRef} style={{ position: 'relative', overflow: 'hidden', marginBottom: 1 }}>
      {/* Red delete panel (behind card) */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 88,
          background: '#e03535',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          opacity: 0,
          color: '#fff',
        }}
      >
        <XIcon size={24} />
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        {...swipeHandlers}
        onPointerDown={(e) => {
          swipeHandlers.onPointerDown?.(e)
          onLongPressStart(e)
        }}
        onPointerMove={(e) => {
          swipeHandlers.onPointerMove?.(e)
          if (longPressTimer.current) {
            const dx = e.clientX - startPosRef.current.x
            const dy = e.clientY - startPosRef.current.y
            if (Math.hypot(dx, dy) > 6) onLongPressEnd()
          }
        }}
        onPointerUp={(e) => {
          swipeHandlers.onPointerUp?.(e)
          onLongPressEnd()
        }}
        onPointerCancel={(e) => {
          swipeHandlers.onPointerCancel?.(e)
          onLongPressEnd()
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 14px',
          background: isActive
            ? 'rgba(212,255,0,0.07)'
            : 'var(--surface-2, rgba(255,255,255,0.04))',
          borderRadius: 14,
          touchAction: 'pan-y',
          userSelect: 'none',
          willChange: 'transform',
          transition: 'background 0.22s ease',
          outline: isActive ? '1px solid rgba(212,255,0,0.18)' : 'none',
        }}
      >
        {/* Thumbnail + play overlay */}
        <div
          style={{
            position: 'relative',
            width: 54,
            height: 54,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--surface-3, rgba(255,255,255,0.07))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <PlatformIcon platform={item.platform} />
          )}
          <PlayOverlay
            onClick={handlePlayClick}
            isActive={isActive}
            isPlaying={isPlaying}
            canPlay={canPlay}
          />
        </div>

        {/* Info */}
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
            {title}
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
            <span style={{ marginRight: 6, opacity: 0.6 }}>
              <PlatformIcon platform={item.platform} />
            </span>
            {item.artistName}
          </p>
        </div>

        {/* Desktop ⋯ menu button */}
        <button
          ref={btnRef}
          type="button"
          {...tapHandlers}
          onClick={(e) => {
            e.stopPropagation()
            setMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect())
          }}
          aria-label="Opciones"
          className="hidden md:flex"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <DotsIcon />
        </button>
      </div>

      {menuAnchor && (
        <ContextMenu
          options={menuOptions}
          anchorRect={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────────── LikedArtistCard ─────────────────────── */

function LikedArtistCard({ item, onUnlike }: { item: LikedProfileItem; onUnlike: () => void }) {
  const navigate = useNavigate()
  const heightRef = useRef<HTMLDivElement>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const { ref: btnRef, tapHandlers } = useTapAnim<HTMLButtonElement>(0.94)

  const { mutate: toggleLike, isPending } = useProfileLike(item.profileId)

  const handleUnlike = useCallback(() => {
    const el = heightRef.current
    if (!el || prefersReducedMotion()) {
      toggleLike()
      onUnlike()
      return
    }
    const h = el.getBoundingClientRect().height
    gsap.to(el, {
      height: h,
      duration: 0.01,
      onComplete: () => {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          marginBottom: 0,
          duration: 0.28,
          ease: EASE.softIn,
          onComplete: () => { toggleLike(); onUnlike() },
        })
      },
    })
  }, [toggleLike, onUnlike])

  const { cardRef, panelRef, swipeHandlers } = useSwipeToDelete<HTMLDivElement, HTMLDivElement>({
    onDelete: handleUnlike,
    disabled: isPending,
  })

  const menuOptions: MenuOption[] = [
    { label: 'Quitar de me gusta', onClick: handleUnlike, danger: true },
    { label: 'Ver perfil', onClick: () => navigate(profilePath(toSlug(item.artistName), item.profileId)) },
  ]

  const onLongPressStart = useCallback((e: React.PointerEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY }
    longPressTimer.current = setTimeout(() => {
      const el = e.currentTarget as HTMLElement
      setMenuAnchor(el.getBoundingClientRect())
    }, 450)
  }, [])

  const onLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <div ref={heightRef} style={{ position: 'relative', overflow: 'hidden', marginBottom: 1 }}>
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 88,
          background: '#e03535',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          opacity: 0,
          color: '#fff',
        }}
      >
        <XIcon size={24} />
      </div>

      <div
        ref={cardRef}
        {...swipeHandlers}
        onPointerDown={(e) => {
          swipeHandlers.onPointerDown?.(e)
          onLongPressStart(e)
        }}
        onPointerMove={(e) => {
          swipeHandlers.onPointerMove?.(e)
          if (longPressTimer.current) {
            const dx = e.clientX - startPosRef.current.x
            const dy = e.clientY - startPosRef.current.y
            if (Math.hypot(dx, dy) > 6) onLongPressEnd()
          }
        }}
        onPointerUp={(e) => {
          swipeHandlers.onPointerUp?.(e)
          onLongPressEnd()
        }}
        onPointerCancel={(e) => {
          swipeHandlers.onPointerCancel?.(e)
          onLongPressEnd()
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 14px',
          background: 'var(--surface-2, rgba(255,255,255,0.04))',
          borderRadius: 14,
          touchAction: 'pan-y',
          userSelect: 'none',
          willChange: 'transform',
        }}
      >
        <Link
          to={profilePath(toSlug(item.artistName), item.profileId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flex: 1,
            minWidth: 0,
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'var(--surface-3, rgba(255,255,255,0.07))',
            }}
          >
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={item.artistName}
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
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {item.artistName[0]?.toUpperCase()}
              </div>
            )}
          </div>
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
              {item.artistName}
            </p>
            {item.genres?.length > 0 && (
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
                {item.genres.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </Link>

        <button
          ref={btnRef}
          type="button"
          {...tapHandlers}
          onClick={(e) => {
            e.stopPropagation()
            setMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect())
          }}
          aria-label="Opciones"
          className="hidden md:flex"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <DotsIcon />
        </button>
      </div>

      {menuAnchor && (
        <ContextMenu
          options={menuOptions}
          anchorRect={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────────── Filter Chips ─────────────────────── */

function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: string[]
  selected: string | null
  onSelect: (v: string | null) => void
}) {
  if (options.length === 0) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 999,
          fontFamily: 'Satoshi, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid',
          borderColor: selected === null ? 'var(--accent)' : 'var(--border)',
          background: selected === null ? 'var(--accent)' : 'transparent',
          color: selected === null ? 'var(--bg)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        Todos
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(selected === opt ? null : opt)}
          style={{
            flexShrink: 0,
            padding: '6px 14px',
            borderRadius: 999,
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid',
            borderColor: selected === opt ? 'var(--accent)' : 'var(--border)',
            background: selected === opt ? 'var(--accent)' : 'transparent',
            color: selected === opt ? 'var(--bg)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────── Empty State ─────────────────────── */

function EmptyState({ label, ctaTo, ctaLabel }: { label: string; ctaTo: string; ctaLabel: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontWeight: 600,
          color: 'var(--text-muted)',
          margin: 0,
        }}
      >
        {label}
      </p>
      <Link
        to={ctaTo}
        style={{
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
        {ctaLabel}
      </Link>
    </div>
  )
}

/* ─────────────────────── Tab: Canciones ─────────────────────── */

function TabCanciones() {
  const { data: songs, isLoading } = useSavedMediaList()
  const listRef = useRef<HTMLDivElement>(null)
  const [genreFilter, setGenreFilter] = useState<string | null>(null)

  const genres = useMemo(() => {
    if (!songs) return []
    const set = new Set<string>()
    songs.forEach((s) => s.genres?.forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [songs])

  const filtered = useMemo(() => {
    if (!songs) return []
    if (!genreFilter) return songs
    return songs.filter((s) => s.genres?.includes(genreFilter))
  }, [songs, genreFilter])

  useEffect(() => {
    const el = listRef.current
    if (!el || !filtered.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('[data-song-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: STAGGER.tight, duration: DURATION.base, ease: EASE.softOut, clearProps: 'transform,opacity' },
    )
  }, [filtered.length])

  if (isLoading) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 78,
              borderRadius: 14,
              background: 'var(--surface-2, rgba(255,255,255,0.04))',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterChips options={genres} selected={genreFilter} onSelect={setGenreFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          label="No hay canciones guardadas aun"
          ctaTo="/profiles"
          ctaLabel="Explorar artistas"
        />
      ) : (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((item, i) => (
            <div key={item._id} data-song-card>
              <SavedSongCard item={item} queue={filtered} queueIndex={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── Tab: Artistas ─────────────────────── */

function TabArtistas() {
  const { data: artists, isLoading } = useLikedProfiles()
  const listRef = useRef<HTMLDivElement>(null)
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const genres = useMemo(() => {
    if (!artists) return []
    const set = new Set<string>()
    artists.forEach((a) => a.genres?.forEach((g: string) => set.add(g)))
    return Array.from(set).sort()
  }, [artists])

  const filtered = useMemo(() => {
    if (!artists) return []
    const base = artists.filter((a) => !removedIds.has(a.profileId))
    if (!genreFilter) return base
    return base.filter((a) => a.genres?.includes(genreFilter))
  }, [artists, genreFilter, removedIds])

  useEffect(() => {
    const el = listRef.current
    if (!el || !filtered.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('[data-artist-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: STAGGER.tight, duration: DURATION.base, ease: EASE.softOut, clearProps: 'transform,opacity' },
    )
  }, [filtered.length])

  if (isLoading) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 78,
              borderRadius: 14,
              background: 'var(--surface-2, rgba(255,255,255,0.04))',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterChips options={genres} selected={genreFilter} onSelect={setGenreFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          label="No hay artistas con me gusta aun"
          ctaTo="/profiles"
          ctaLabel="Explorar artistas"
        />
      ) : (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((item) => (
            <div key={item.profileId} data-artist-card>
              <LikedArtistCard
                item={item}
                onUnlike={() => setRemovedIds((prev) => new Set([...prev, item.profileId]))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── Page ─────────────────────── */

export default function Biblioteca() {
  const [params, setParams] = useSearchParams()
  const initialTab = params.get('tab') ?? 'canciones'
  const [tab, setTabState] = useState(initialTab)
  const pageRef = useRef<HTMLDivElement>(null)
  const { current, close: closePlayer } = usePlayerStore()
  const hasActivePlayer = Boolean(current())

  useEffect(() => {
    const queryTab = params.get('tab') ?? 'canciones'
    if (queryTab !== tab) {
      setTabState(queryTab)
    }
  }, [params])

  useEffect(() => {
    const el = pageRef.current
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut })
  }, [])

  // Stop playback when leaving the library page
  useEffect(() => {
    return () => { closePlayer() }
  }, [closePlayer])

  function setTab(t: string) {
    setTabState(t)
    setParams({ tab: t }, { replace: true })
  }

  const tabStyle = (t: string): CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    fontFamily: "'Clash Display', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.02em',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
    borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
    transition: 'color 0.2s ease, border-color 0.2s ease',
  })

  return (
    <div
      ref={pageRef}
      style={{
        maxWidth: 720,
        margin: '0 auto',
        // Extra bottom padding when the player bar is visible so last row isn't hidden
        padding: `calc(var(--header-h, 72px) + 24px) 20px ${hasActivePlayer ? 104 : 48}px`,
        minHeight: '100dvh',
        transition: 'padding-bottom 0.3s ease',
      }}
    >
      {/* Page heading */}
      <h1
        style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 28px',
          letterSpacing: '-0.02em',
        }}
      >
        Biblioteca
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
        }}
      >
        <button type="button" style={tabStyle('canciones')} onClick={() => setTab('canciones')}>
          Canciones
        </button>
        <button type="button" style={tabStyle('artistas')} onClick={() => setTab('artistas')}>
          Artistas
        </button>
      </div>

      {/* Tab content */}
      {tab === 'canciones' ? <TabCanciones /> : <TabArtistas />}

      {/* Player — portals into document.body, visible across tabs */}
      <LibraryPlayerBar />
      <LibraryNowPlaying />
    </div>
  )
}
