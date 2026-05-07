import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { buildFeed } from '../../../utils/profileFeed.js'
import { ContentViewerItem } from './ContentViewerItem.js'
import { ContentViewerHUD } from './ContentViewerHUD.js'
import { THEMES } from '../ThemeSelector.js'
import type { ProfileResponse, EventResponse } from '../../../types/index.js'

interface ContentViewerProps {
  profile: ProfileResponse
  events: EventResponse[]
  initialItem: { kind: 'photo' | 'media' | 'event'; id: string }
  originRect?: DOMRect | null
  onClose: () => void
}

export function ContentViewer({
  profile,
  events,
  initialItem,
  originRect,
  onClose,
}: ContentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])
  const currentIndexRef = useRef(0)
  const closingRef = useRef(false)

  const feed = buildFeed(profile, events)
  const initialIndex = Math.max(
    0,
    feed.findIndex((f) => f.kind === initialItem.kind && f.id === initialItem.id),
  )

  const themeConfig = THEMES.find((t) => t.id === (profile.theme ?? 'minimal')) ?? THEMES[0]
  const profileAccent = profile.accentColor || themeConfig.particle

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const activeSection = sectionsRef.current[currentIndexRef.current]

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.28,
      ease: 'expo.in',
    })

    if (originRect && activeSection) {
      const scaleX = originRect.width / window.innerWidth
      const scaleY = originRect.height / window.innerHeight
      const tx = originRect.left + originRect.width / 2 - window.innerWidth / 2
      const ty = originRect.top + originRect.height / 2 - window.innerHeight / 2

      gsap.to(activeSection, {
        scale: Math.min(scaleX, scaleY),
        x: tx,
        y: ty,
        opacity: 0,
        duration: 0.3,
        ease: 'expo.in',
        onComplete: onClose,
      })
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.28,
        ease: 'expo.in',
        onComplete: onClose,
      })
    }
  }, [onClose, originRect])

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowDown') {
        const next = sectionsRef.current[currentIndexRef.current + 1]
        next?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      if (e.key === 'ArrowUp') {
        const prev = sectionsRef.current[currentIndexRef.current - 1]
        prev?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // History back button
  useEffect(() => {
    window.history.pushState({ viewer: true }, '')
    function onPop() { handleClose() }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [handleClose])

  // Intersection Observer to track current index
  useEffect(() => {
    const sections = sectionsRef.current.filter(Boolean) as HTMLElement[]
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target as HTMLElement)
            if (idx !== -1) currentIndexRef.current = idx
          }
        }
      },
      { threshold: 0.55 },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [feed.length])

  // Scroll to initial item on mount (instant, before paint)
  useEffect(() => {
    const target = sectionsRef.current[initialIndex]
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [initialIndex])

  // FLIP entrance animation
  useEffect(() => {
    if (!overlayRef.current) return

    if (originRect) {
      const scaleX = originRect.width / window.innerWidth
      const scaleY = originRect.height / window.innerHeight
      const tx = originRect.left + originRect.width / 2 - window.innerWidth / 2
      const ty = originRect.top + originRect.height / 2 - window.innerHeight / 2

      const activeSection = sectionsRef.current[initialIndex]
      if (activeSection) {
        gsap.set(activeSection, { scale: Math.min(scaleX, scaleY), x: tx, y: ty, opacity: 0 })
        gsap.set(overlayRef.current, { opacity: 0 })
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.18, ease: 'none' })
        gsap.to(activeSection, {
          scale: 1,
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.36,
          ease: 'expo.out',
        })
        return
      }
    }

    // Fallback: simple fade
    gsap.from(overlayRef.current, { opacity: 0, duration: 0.22, ease: 'none' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: profile.artistName, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [profile.artistName])

  if (feed.length === 0) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ background: 'var(--bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de contenido de ${profile.artistName}`}
    >
      {/* Scroll snap container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'auto' }}
      >
        {feed.map((item, i) => {
          const isActive = i === initialIndex
          const isNear = Math.abs(i - initialIndex) <= 1
          return (
            <section
              key={`${item.kind}-${item.id}`}
              ref={(el) => { sectionsRef.current[i] = el }}
              className="relative w-full"
              style={{ height: '100svh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
            >
              <ContentViewerItem
                item={item}
                profile={profile}
                isActive={isActive}
                isNear={isNear}
              />
              <ContentViewerHUD
                item={item}
                profile={profile}
                onClose={handleClose}
                onShare={handleShare}
                profileAccent={profileAccent}
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}
