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
