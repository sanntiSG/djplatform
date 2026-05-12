import gsap from 'gsap'
import { prefersReducedMotion } from './motion.js'

export function highlightItem(itemId: string): void {
  const el = document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(itemId)}"]`)
  if (!el) return

  const reduced = prefersReducedMotion()
  el.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' })

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()

  if (reduced) {
    el.style.boxShadow = `0 0 0 3px ${accent}`
    setTimeout(() => { el.style.boxShadow = '' }, 1400)
    return
  }

  gsap
    .timeline()
    .to(el, { boxShadow: `0 0 0 3px ${accent}`, duration: 0.35, ease: 'expo.out' })
    .to(el, { boxShadow: '0 0 0 0 transparent', duration: 0.5, ease: 'expo.in', clearProps: 'boxShadow' }, '+=0.7')
}
