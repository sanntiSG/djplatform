import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion.js'

export function useTapAnim<T extends HTMLElement>(scaleDown = 0.93) {
  const ref = useRef<T>(null)
  const qTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null)

  const getQTo = useCallback(() => {
    if (!ref.current) return null
    if (!qTo.current) {
      qTo.current = gsap.quickTo(ref.current, 'scale', {
        duration: DURATION.tap,
        ease: EASE.out,
      })
    }
    return qTo.current
  }, [])

  const onPointerDown = useCallback(() => {
    if (prefersReducedMotion()) return
    getQTo()?.(scaleDown)
  }, [scaleDown, getQTo])

  const release = useCallback(() => {
    if (prefersReducedMotion()) return
    const el = ref.current
    if (!el) return
    gsap.to(el, {
      scale: 1,
      duration: DURATION.micro,
      ease: EASE.pop,
    })
    qTo.current = null
  }, [])

  return {
    ref,
    tapHandlers: {
      onPointerDown,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    },
  }
}
