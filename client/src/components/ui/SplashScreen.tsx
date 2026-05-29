import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion.js'

const N_PANELS = 8
const ROTATION_COEF = 5

const SUBTITLES = [
  'Afinando el ritmo...',
  'Preparando el estudio...',
  'Cargando la experiencia musical...',
]

function panelGradient(i: number): string {
  const stop = 72 + i * 3
  return `linear-gradient(105deg, var(--accent) 0%, var(--c-purple) 22%, var(--c-blue) 46%, var(--bg) ${stop}%)`
}

interface Props {
  ready: boolean
  onExited: () => void
  progress?: number
}

export default function SplashScreen({ ready, onExited, progress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<HTMLDivElement[]>([])
  const logoRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const countEl = useRef<HTMLSpanElement>(null)
  const countObj = useRef({ val: 0 })
  const enterTl = useRef<gsap.core.Timeline | null>(null)
  const holdTweens = useRef<gsap.core.Tween[]>([])
  const exitPending = useRef(false)
  const reduced = prefersReducedMotion()

  const [subtitleIdx, setSubtitleIdx] = useState(0)

  // Subtitle rotation
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setSubtitleIdx((n) => (n + 1) % SUBTITLES.length), 1600)
    return () => clearInterval(id)
  }, [reduced])

  // Subtitle fade-in on change
  useEffect(() => {
    if (!subtitleRef.current || reduced) return
    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' },
    )
  }, [subtitleIdx, reduced])

  // Reactive counter driven by real boot progress
  useEffect(() => {
    if (progress === undefined) return
    const obj = countObj.current
    const target = Math.max(progress, Math.round(obj.val))
    gsap.to(obj, {
      val: target,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        if (countEl.current)
          countEl.current.textContent = String(Math.floor(obj.val)).padStart(2, '0')
      },
    })
  }, [progress])

  // Main animation setup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    document.body.style.overflow = 'hidden'

    if (reduced) {
      gsap.set(logoRef.current, { opacity: 1 })
      return () => {
        document.body.style.overflow = ''
      }
    }

    const ctx = gsap.context(() => {
      const panels = panelRefs.current
      const logo = logoRef.current
      if (!logo) return

      const elH = window.innerHeight / N_PANELS
      const elW = window.innerWidth / N_PANELS

      // Logo entrance
      gsap.fromTo(
        logo,
        { opacity: 0, y: 20, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, delay: 0.5, ease: 'expo.out' },
      )

      // Panel entry — all start simultaneously, varying durations (like Spotify Wrapped)
      const tl = gsap.timeline({
        onComplete: () => {
          // Hold: gentle oscillating rotation per panel
          panels.forEach((panel, i) => {
            const dir = i % 2 === 0 ? 1 : -1
            const hw = holdTweens.current
            hw.push(
              gsap.to(panel, {
                rotation: `+=${dir * 20}`,
                yoyo: true,
                repeat: -1,
                duration: 2.8 + i * 0.2,
                ease: 'sine.inOut',
              }),
            )
          })
        },
      })
      enterTl.current = tl

      panels.forEach((panel, i) => {
        const wi = window.innerWidth - elW * (N_PANELS - i) + elW
        const he = window.innerHeight - elH * (N_PANELS - i) + elH
        const grad = panelGradient(i)

        tl.fromTo(
          panel,
          { y: elH * 4.5, x: elW * 4.5, width: 0, height: 0, rotation: -280, opacity: 0.95, background: grad },
          {
            width: wi,
            height: he,
            y: -elH / 1.33 + ((N_PANELS - i) * elH) / 1.33,
            x: 0,
            duration: 0.85 + 0.09 * (N_PANELS - i),
            ease: 'expo.out',
            rotation: N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF,
            opacity: 0.88,
            background: grad,
          },
          0,
        )
      })
    }, container)

    return () => {
      ctx.revert()
      holdTweens.current.forEach((t) => t.kill())
      holdTweens.current = []
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger exit when ready
  useEffect(() => {
    if (!ready || exitPending.current) return
    exitPending.current = true

    const finish = () => {
      const container = containerRef.current
      if (!container) { onExited(); return }

      holdTweens.current.forEach((t) => t.kill())
      holdTweens.current = []
      enterTl.current?.kill()

      // Panels retract
      panelRefs.current.forEach((panel, i) => {
        gsap.to(panel, {
          width: 0,
          height: 0,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          rotation: '+=240',
          opacity: 0,
          duration: 0.55,
          delay: i * 0.025,
          ease: 'expo.in',
        })
      })

      // Container fade out
      gsap.to(container, {
        opacity: 0,
        scale: 0.96,
        duration: 0.48,
        delay: 0.12,
        ease: 'power2.inOut',
        onComplete: () => {
          document.body.style.overflow = ''
          onExited()
        },
      })
    }

    // First bring counter to 100, then exit
    gsap.killTweensOf(countObj.current)
    gsap.to(countObj.current, {
      val: 100,
      duration: 0.32,
      ease: 'power2.out',
      onUpdate: () => {
        if (countEl.current)
          countEl.current.textContent = String(Math.floor(countObj.current.val)).padStart(2, '0')
      },
      onComplete: finish,
    })
  }, [ready, onExited])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Panels */}
      {!reduced &&
        Array.from({ length: N_PANELS }, (_, i) => (
          <div
            key={i}
            ref={(el) => { if (el) panelRefs.current[i] = el }}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              zIndex: N_PANELS - i,
              background: panelGradient(i),
              opacity: 0,
            }}
          />
        ))}

      {/* Radial spotlight so text stays readable over panels */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: N_PANELS + 1,
          background:
            'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(8,8,10,0.72) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Center content */}
      <div
        ref={logoRef}
        style={{
          position: 'relative',
          zIndex: N_PANELS + 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          opacity: reduced ? 1 : 0,
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 'clamp(3.2rem, 11vw, 6.5rem)',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(212,255,0,0.32), 0 0 120px rgba(212,255,0,0.12)',
          }}
        >
          REsonar
        </span>

        <p
          ref={subtitleRef}
          style={{
            fontFamily: 'Satoshi, system-ui, sans-serif',
            fontSize: 'clamp(0.72rem, 2.2vw, 0.9rem)',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            opacity: reduced ? 1 : 0,
          }}
        >
          {SUBTITLES[subtitleIdx]}
        </p>

        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span
            ref={countEl}
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
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            / 100
          </span>
        </div>
      </div>
    </div>
  )
}
