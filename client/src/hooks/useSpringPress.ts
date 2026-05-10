import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../utils/motion.js'

export function useSpringPress<T extends HTMLElement>(scaleDown = 0.96) {
  const ref = useRef<T>(null)

  const onPointerDown = useCallback(() => {
    if (prefersReducedMotion() || !ref.current) return
    gsap.to(ref.current, {
      scale: scaleDown,
      duration: 0.12,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }, [scaleDown])

  const onRelease = useCallback(() => {
    if (prefersReducedMotion() || !ref.current) return
    gsap.to(ref.current, {
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
      overwrite: 'auto',
    })
  }, [])

  return {
    ref,
    springHandlers: {
      onPointerDown,
      onPointerUp: onRelease,
      onPointerLeave: onRelease,
      onPointerCancel: onRelease,
    },
  }
}
