/**
 * useColdStartProgress
 *
 * Drives the boot progress bar from a real signal: GET /api/health.
 *
 * While the server is cold-starting:
 *   – polls /api/health every 2.5s until it responds
 *   – advances a continuous exponential curve (5 → ~91%) as time passes
 *   – progress is always moving forward — never freezes
 *
 * Once /api/health responds AND data queries are ready:
 *   – tweens smoothly to 100 in 0.45s
 *
 * Same source of truth for both SplashScreen and PuzzleLoader.
 * Replaces the heuristic-hito approach of useAppBootProgress.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface ColdStartProgressOptions {
  isDataReady: boolean
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const HEALTH_URL = `${API_BASE}/health`

const POLL_INTERVAL_MS = 2_500
const REQUEST_TIMEOUT_MS = 4_000

// Exponential ease curve: p(t) = INITIAL + (CAP - INITIAL) * (1 - e^(-t/TAU))
const INITIAL = 5
const CAP = 91
const TAU_MS = 20_000  // time constant — at ~1 tau (20s) ~63% of the range is covered

function computeProgress(elapsedMs: number): number {
  return INITIAL + (CAP - INITIAL) * (1 - Math.exp(-elapsedMs / TAU_MS))
}

export function useColdStartProgress({ isDataReady }: ColdStartProgressOptions): number {
  const objRef = useRef({ val: INITIAL })
  const [smoothed, setSmoothed] = useState(INITIAL)

  const serverAliveRef = useRef(false)
  const completedRef = useRef(false)
  const startMsRef = useRef(Date.now())
  // Keep a ref so poll callback always sees the latest value without stale closure
  const isDataReadyRef = useRef(isDataReady)
  useEffect(() => { isDataReadyRef.current = isDataReady }, [isDataReady])

  const tryComplete = useCallback(() => {
    if (completedRef.current) return
    if (!serverAliveRef.current || !isDataReadyRef.current) return
    completedRef.current = true
    const obj = objRef.current
    gsap.killTweensOf(obj)
    gsap.to(obj, {
      val: 100,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => setSmoothed(Math.round(obj.val)),
    })
  }, [])

  // Continuous smooth progress via GSAP ticker (fires at rAF rate)
  useEffect(() => {
    const obj = objRef.current
    const tick = () => {
      if (completedRef.current) return
      const elapsed = Date.now() - startMsRef.current
      const target = computeProgress(elapsed)
      if (target > obj.val) {
        obj.val = target
        setSmoothed(Math.round(target))
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  // Poll /api/health until the server wakes up
  useEffect(() => {
    let stopped = false
    let timerId: ReturnType<typeof setTimeout>

    const poll = () => {
      if (stopped || serverAliveRef.current) return

      const controller = new AbortController()
      const abort = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      fetch(HEALTH_URL, { signal: controller.signal, cache: 'no-store' })
        .then(() => {
          serverAliveRef.current = true
          tryComplete()
        })
        .catch(() => {
          if (!stopped) timerId = setTimeout(poll, POLL_INTERVAL_MS)
        })
        .finally(() => clearTimeout(abort))
    }

    poll()
    return () => {
      stopped = true
      clearTimeout(timerId)
    }
  }, [tryComplete])

  // Also complete when data arrives (server may have already responded)
  useEffect(() => {
    tryComplete()
  }, [isDataReady, tryComplete])

  return smoothed
}
