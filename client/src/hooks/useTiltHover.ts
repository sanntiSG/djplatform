import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export function useTiltHover<T extends HTMLElement>(maxAngle = 7) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rxTo = gsap.quickTo(el, 'rotateX', { duration: 0.55, ease: 'power3.out' })
    const ryTo = gsap.quickTo(el, 'rotateY', { duration: 0.55, ease: 'power3.out' })

    function onEnter() {
      gsap.set(el, { transformPerspective: 900 })
    }
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      ryTo((nx - 0.5) * maxAngle * 2)
      rxTo(-(ny - 0.5) * maxAngle * 2)
    }
    function onLeave() {
      rxTo(0)
      ryTo(0)
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      gsap.set(el, { rotateX: 0, rotateY: 0 })
    }
  }, [maxAngle])

  return ref
}
