import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../utils/motion.js'

gsap.registerPlugin(ScrollTrigger)

interface SplitRevealOptions {
  /** Split by 'chars' (default) or 'words' */
  by?: 'chars' | 'words'
  stagger?: number
  duration?: number
  y?: number
  scrub?: number | boolean
  start?: string
  end?: string
}

/**
 * Splits the text content of a ref'd element into individual spans,
 * then reveals them one-by-one on scroll.
 * Returns the ref to attach to the container element.
 */
export function useSplitReveal(opts: SplitRevealOptions = {}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const original = el.innerHTML
    const text = el.textContent ?? ''
    const units = opts.by === 'words' ? text.split(/\s+/) : text.split('')

    el.innerHTML = units
      .map((u) => `<span class="sr-unit" style="display:inline-block;overflow:hidden;vertical-align:top">${
        u === ' ' ? '&nbsp;' : u
      }</span>`)
      .join(opts.by === 'words' ? ' ' : '')

    const spans = el.querySelectorAll<HTMLElement>('.sr-unit')

    gsap.set(spans, { y: opts.y ?? 24, opacity: 0 })

    const st = ScrollTrigger.create({
      trigger: el,
      start: opts.start ?? 'top 85%',
      end: opts.end ?? 'bottom 20%',
      scrub: opts.scrub,
      onEnter: opts.scrub
        ? undefined
        : () => {
            gsap.to(spans, {
              y: 0,
              opacity: 1,
              duration: opts.duration ?? 0.55,
              ease: 'expo.out',
              stagger: opts.stagger ?? 0.025,
            })
          },
      ...(opts.scrub
        ? {
            animation: gsap.fromTo(spans, { y: opts.y ?? 24, opacity: 0 }, {
              y: 0, opacity: 1,
              stagger: opts.stagger ?? 0.025,
              duration: opts.duration ?? 0.55,
              ease: 'none',
            }),
          }
        : {}),
      once: !opts.scrub,
    })

    return () => {
      st.kill()
      if (el) el.innerHTML = original
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return ref as React.RefObject<HTMLElement>
}
