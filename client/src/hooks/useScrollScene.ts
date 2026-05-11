import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../utils/motion.js'

gsap.registerPlugin(ScrollTrigger)

interface ScrollSceneOptions {
  scrub?: number | boolean
  pin?: boolean
  start?: string
  end?: string
  onEnter?: () => void
  onLeave?: () => void
}

/**
 * Attaches a ScrollTrigger pinned scene to a ref'd element.
 * Returns { sectionRef, tlRef } — write your master timeline to tlRef.current
 * inside a useEffect, then call buildScene() to attach it.
 */
export function useScrollScene(opts: ScrollSceneOptions = {}) {
  const sectionRef = useRef<HTMLElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const stRef = useRef<ScrollTrigger | null>(null)

  const buildScene = () => {
    const section = sectionRef.current
    const tl = tlRef.current
    if (!section || !tl || prefersReducedMotion()) return

    stRef.current?.kill()
    stRef.current = ScrollTrigger.create({
      animation: tl,
      trigger: section,
      pin: opts.pin ?? true,
      scrub: opts.scrub ?? 1,
      start: opts.start ?? 'top top',
      end: opts.end ?? '+=100%',
      onEnter: opts.onEnter,
      onLeave: opts.onLeave,
    })
  }

  useEffect(() => {
    return () => {
      stRef.current?.kill()
      tlRef.current?.kill()
    }
  }, [])

  return { sectionRef, tlRef, buildScene }
}
