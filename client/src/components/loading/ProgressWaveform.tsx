import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion'

const ACCENT_HEX = '#d4ff00'
const DIM = 'rgba(242,242,247,0.08)'
const GLOW = '0 0 8px rgba(212,255,0,0.45)'

// Procedural bar height: double-sine produces a natural waveform silhouette
function barHeight(i: number, total: number): number {
  const t = i / (total - 1)
  const base = Math.sin(t * Math.PI * 2.5) * 0.45 + 0.55
  const fine = Math.sin(t * Math.PI * 7.3 + 1.2) * 0.15
  return Math.max(0.18, Math.min(1.0, base + fine))
}

interface Props {
  progress: number // 0-100
}

export function ProgressWaveform({ progress }: Props) {
  const reduced = prefersReducedMotion()
  const countRef = useRef(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 24 : 32,
  )
  const count = countRef.current
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevActiveRef = useRef(0)
  const counterRef = useRef<HTMLSpanElement>(null)
  const counterObj = useRef({ val: 0 })
  const pulseIds = useRef<(gsap.core.Tween | undefined)[]>([])

  // Initialize bars to dim on mount
  useEffect(() => {
    barRefs.current.forEach((bar) => {
      if (bar) gsap.set(bar, { backgroundColor: DIM })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const activeCount = Math.round((progress / 100) * count)
    const prev = prevActiveRef.current

    // Animate counter number
    gsap.killTweensOf(counterObj.current)
    gsap.to(counterObj.current, {
      val: progress,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(
            Math.round(counterObj.current.val),
          ).padStart(2, '0')
        }
      },
    })

    barRefs.current.forEach((bar, i) => {
      if (!bar) return
      const nowActive = i < activeCount
      const wasActive = i < prev

      if (nowActive && !wasActive) {
        // Activate bar
        gsap.to(bar, {
          backgroundColor: ACCENT_HEX,
          duration: 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
          onComplete: () => {
            if (bar) bar.style.boxShadow = GLOW
          },
        })

        if (!reduced) {
          const hBase = barHeight(i, count)
          const mag = 0.07 + (1 - hBase) * 0.04
          const pulse = gsap.to(bar, {
            scaleY: 1 + mag,
            yoyo: true,
            repeat: -1,
            duration: 0.48 + hBase * 0.32,
            ease: 'sine.inOut',
            delay: (i % 9) * 0.055,
            overwrite: false,
          })
          pulseIds.current[i] = pulse
        }
      } else if (!nowActive && wasActive) {
        // Deactivate bar
        if (pulseIds.current[i]) {
          pulseIds.current[i].kill()
          delete pulseIds.current[i]
        }
        bar.style.boxShadow = 'none'
        gsap.to(bar, {
          backgroundColor: DIM,
          scaleY: 1,
          duration: 0.14,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
    })

    // Sweep animation when fully loaded
    if (progress >= 100 && !reduced) {
      const activeBars = barRefs.current.slice(0, activeCount).filter(Boolean)
      pulseIds.current.forEach((t) => t?.kill())
      pulseIds.current = []
      gsap.to(activeBars, {
        scaleY: 1,
        duration: 0.38,
        ease: 'expo.out',
        stagger: 0.007,
        overwrite: 'auto',
      })
    }

    prevActiveRef.current = activeCount
  }, [progress, count, reduced])

  // Cleanup pulses on unmount
  useEffect(() => {
    return () => {
      pulseIds.current.forEach((t) => t?.kill())
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 'clamp(220px, 50vw, 360px)',
          height: 'clamp(26px, 7vh, 40px)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'clamp(2px, 0.4vw, 3px)',
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            ref={(el) => { barRefs.current[i] = el }}
            style={{
              flex: 1,
              height: `${barHeight(i, count) * 100}%`,
              borderRadius: '2px 2px 0 0',
              transformOrigin: 'bottom center',
              willChange: 'transform, background-color',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span
          ref={counterRef}
          style={{
            fontFamily: 'Satoshi, system-ui, sans-serif',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.14em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          00
        </span>
        <span
          style={{
            fontFamily: 'Satoshi, system-ui, sans-serif',
            fontSize: '0.72rem',
            color: 'rgba(242,242,247,0.3)',
            letterSpacing: '0.08em',
          }}
        >
          / 100
        </span>
      </div>
    </div>
  )
}
