import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const DURATION = {
  tap: 0.12,
  micro: 0.18,
  base: 0.28,
  enter: 0.48,
  slow: 0.65,
} as const

export const EASE = {
  iosSpring: [0.32, 0.72, 0, 1] as [number, number, number, number],
  out: 'power3.out',
  pop: 'back.out(1.6)',
  popStrong: 'back.out(2.2)',
  softIn: 'expo.in',
  softOut: 'expo.out',
  inOut: 'power2.inOut',
} as const

export const STAGGER = {
  tight: 0.03,
  base: 0.06,
  loose: 0.1,
} as const

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ──────────────────────────────────────────────────────────
   Animation presets — reusable across Feed, Profile, etc.
────────────────────────────────────────────────────────── */

interface RevealOptions {
  y?: number
  stagger?: number
  start?: string
  delay?: number
}

/** Staggered fade-up reveal on scroll for a list of targets. */
export function revealStagger(
  targets: gsap.TweenTarget,
  trigger: Element,
  opts: RevealOptions = {},
): ScrollTrigger {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 })
    return ScrollTrigger.create({ trigger })
  }
  gsap.set(targets, { opacity: 0, y: opts.y ?? 40 })
  const st = ScrollTrigger.create({
    trigger,
    start: opts.start ?? 'top 82%',
    onEnter: () => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: DURATION.enter,
        ease: EASE.softOut,
        stagger: opts.stagger ?? STAGGER.base,
        delay: opts.delay ?? 0,
      })
    },
    once: true,
  })
  return st
}

interface PinnedSceneOptions {
  scrub?: number | boolean
  start?: string
  end?: string
}

/** Pins a section and scrubs a master timeline to it (IPhoneWidgets-style). */
export function pinnedScene(
  section: Element,
  tl: gsap.core.Timeline,
  opts: PinnedSceneOptions = {},
): ScrollTrigger {
  return ScrollTrigger.create({
    animation: tl,
    trigger: section,
    pin: true,
    scrub: opts.scrub ?? 1,
    start: opts.start ?? 'top top',
    end: opts.end ?? '+=120%',
  })
}

/** Magnetic hover: element follows cursor with spring-like feel. Returns cleanup fn. */
export function magneticHover(el: HTMLElement, strength = 0.38): () => void {
  if (prefersReducedMotion()) return () => { }
  const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: EASE.out })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: EASE.out })
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    xTo((e.clientX - (r.left + r.width / 2)) * strength)
    yTo((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onLeave = () => { xTo(0); yTo(0) }
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    gsap.set(el, { x: 0, y: 0 })
  }
}

/** 3D tilt on hover. Returns cleanup fn. */
export function tiltCard(el: HTMLElement, maxDeg = 9): () => void {
  if (prefersReducedMotion()) return () => { }
  const rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.55, ease: EASE.out })
  const ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.55, ease: EASE.out })
  const onEnter = () => gsap.set(el, { transformPerspective: 900 })
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    ryTo(((e.clientX - r.left) / r.width - 0.5) * maxDeg * 2)
    rxTo(-((e.clientY - r.top) / r.height - 0.5) * maxDeg * 2)
  }
  const onLeave = () => { rxTo(0); ryTo(0) }
  el.addEventListener('mouseenter', onEnter)
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mouseenter', onEnter)
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    gsap.set(el, { rotationX: 0, rotationY: 0 })
  }
}
