/**
 * ProjectPhaseBar — barra visual de las 5 fases de un proyecto.
 * Muestra la fase actual resaltada con el acento de la plataforma.
 * Animacion GSAP de entrada opcional.
 */
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { PROJECT_PHASES, PROJECT_PHASE_LABELS } from '@dj/shared'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import type { ProjectPhase } from '../../types/index.js'

export function ProjectPhaseBar({ phase, animate = true }: { phase: ProjectPhase; animate?: boolean }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current || !animate || prefersReducedMotion()) return
    const pills = barRef.current.querySelectorAll('.phase-pill')
    gsap.fromTo(
      pills,
      { opacity: 0, scale: 0.88, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: DURATION.base, ease: EASE.softOut, stagger: 0.06 },
    )
  }, [animate])

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-label={`Fase del proyecto: ${PROJECT_PHASE_LABELS[phase]}`}
      aria-valuenow={PROJECT_PHASES.indexOf(phase) + 1}
      aria-valuemin={1}
      aria-valuemax={PROJECT_PHASES.length}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
      }}
      className="no-scrollbar"
    >
      {PROJECT_PHASES.map((p, i) => {
        const isActive   = p === phase
        const isPast     = PROJECT_PHASES.indexOf(phase) > i

        return (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span
              className="phase-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: isActive ? '0.02em' : '0.01em',
                padding: '4px 10px',
                borderRadius: 'var(--radius-xl)',
                background: isActive
                  ? 'var(--accent)'
                  : isPast
                    ? 'rgba(212,255,0,0.12)'
                    : 'var(--surface)',
                color: isActive
                  ? 'var(--bg)'
                  : isPast
                    ? 'rgba(212,255,0,0.7)'
                    : 'var(--text-muted)',
                border: isActive
                  ? 'none'
                  : `1px solid ${isPast ? 'rgba(212,255,0,0.2)' : 'var(--border)'}`,
                transition: 'background 0.3s ease, color 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {isPast && !isActive && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {PROJECT_PHASE_LABELS[p]}
            </span>
            {i < PROJECT_PHASES.length - 1 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ color: isPast ? 'rgba(212,255,0,0.4)' : 'var(--border)', flexShrink: 0 }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}
