import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../utils/motion.js'

interface Options {
  duration?: number
  ease?: string
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

/**
 * Animates a numeric value from `from` to `to` and writes it to a DOM element via ref.
 * Triggers on mount. Returns a ref to attach to the element that shows the number.
 */
export function useCounterTween(from: number, to: number, opts: Options = {}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.textContent = `${opts.prefix ?? ''}${to}${opts.suffix ?? ''}`
      return
    }
    const proxy = { val: from }
    const tween = gsap.to(proxy, {
      val: to,
      duration: opts.duration ?? 1.4,
      ease: opts.ease ?? 'power2.out',
      delay: opts.delay ?? 0,
      onUpdate: () => {
        const v = opts.decimals
          ? proxy.val.toFixed(opts.decimals)
          : Math.round(proxy.val).toString()
        el.textContent = `${opts.prefix ?? ''}${v}${opts.suffix ?? ''}`
      },
    })
    return () => { tween.kill() }
  }, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  return ref
}
