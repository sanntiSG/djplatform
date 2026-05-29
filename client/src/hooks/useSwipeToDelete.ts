import { useCallback, useRef } from 'react'
import gsap from 'gsap'
import { EASE, prefersReducedMotion } from '../utils/motion.js'

interface Options {
  threshold?: number
  onDelete: () => void
  disabled?: boolean
}

export function useSwipeToDelete<C extends HTMLElement = HTMLDivElement, P extends HTMLElement = HTMLDivElement>(
  opts: Options,
) {
  const cardRef = useRef<C>(null)
  const panelRef = useRef<P>(null)
  const startX = useRef(0)
  const dragging = useRef(false)
  const threshold = opts.threshold ?? 75

  const rollback = useCallback(() => {
    const card = cardRef.current
    const panel = panelRef.current
    if (!card || !panel) return
    gsap.to(card, { x: 0, duration: 0.42, ease: EASE.out })
    gsap.to(panel, { opacity: 0, duration: 0.28, ease: EASE.out })
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (opts.disabled || prefersReducedMotion()) return
      startX.current = e.clientX
      dragging.current = true
      cardRef.current?.setPointerCapture(e.pointerId)
    },
    [opts.disabled],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || opts.disabled) return
      const dx = e.clientX - startX.current
      if (dx >= 0) return
      const clamped = Math.max(-120, dx)
      gsap.set(cardRef.current, { x: clamped })
      const ratio = Math.min(1, Math.abs(clamped) / threshold)
      gsap.set(panelRef.current, { opacity: ratio })
    },
    [opts.disabled, threshold],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      const dx = e.clientX - startX.current

      if (dx < -threshold) {
        const card = cardRef.current
        const panel = panelRef.current
        gsap.to(card, { x: -window.innerWidth, opacity: 0, duration: 0.26, ease: 'power2.in' })
        gsap.to(panel, {
          opacity: 0,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: opts.onDelete,
        })
      } else {
        rollback()
      }
    },
    [threshold, opts.onDelete, rollback],
  )

  const onPointerCancel = useCallback(() => {
    dragging.current = false
    rollback()
  }, [rollback])

  return {
    cardRef,
    panelRef,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    } as React.HTMLAttributes<HTMLElement>,
  }
}
