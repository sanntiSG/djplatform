/**
 * Projects — listado explorable + tab "Mis proyectos".
 * Filters: phase, role.
 * Design: oscuro premium, identidad REsonar. Fuentes Clash Display + Satoshi.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ProjectCard } from '../components/projects/ProjectCard.js'
import { useProjectList, useMyProjects } from '../hooks/useProjects.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { prefersReducedMotion, DURATION, EASE } from '../utils/motion.js'
import { PROJECT_PHASES, PROJECT_PHASE_LABELS } from '@dj/shared'
import type { ProjectPhase } from '../types/index.js'
import { cn } from '../utils/cn.js'

gsap.registerPlugin(ScrollTrigger)

const PHASE_FILTERS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Todas las fases' },
  ...PROJECT_PHASES.map((p) => ({ id: p, label: PROJECT_PHASE_LABELS[p] })),
]

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'Satoshi, sans-serif',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        padding: '6px 14px',
        borderRadius: 'var(--radius-xl)',
        border: active ? 'none' : '1px solid var(--border)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text-muted)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 150ms, color 150ms',
      }}
    >
      {children}
    </button>
  )
}

export default function Projects() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'explore' | 'mine'>('explore')
  const [phaseFilter, setPhaseFilter] = useState('')
  const pageRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const exploreQuery = useProjectList({
    phase: phaseFilter || undefined,
    status: 'open',
  })
  const mineQuery = useMyProjects()

  const items = tab === 'explore' ? (exploreQuery.data ?? []) : (mineQuery.data ?? [])
  const isLoading = tab === 'explore' ? exploreQuery.isLoading : mineQuery.isLoading

  // Page enter animation
  useEffect(() => {
    if (!pageRef.current || prefersReducedMotion()) return
    gsap.fromTo(pageRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut })
  }, [])

  // Grid stagger on data change
  useEffect(() => {
    const el = gridRef.current
    if (!el || !items.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('.project-card-anim')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.softOut, stagger: 0.05 },
    )
  }, [items.length, tab])

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingTop: 'calc(var(--header-h, 72px) + 24px)',
        paddingBottom: 64,
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 4px' }}>
              Construccion colectiva
            </p>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>
              Proyectos
            </h1>
          </div>
          {user && (
            <Link
              to="/proyectos/nueva"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 18px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--accent)',
                color: 'var(--bg)',
                textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nuevo proyecto
            </Link>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {(['explore', 'mine'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'color 150ms, border-color 150ms',
                  marginBottom: -1,
                }}
              >
                {t === 'explore' ? 'Explorar' : 'Mis proyectos'}
              </button>
            ))}
          </div>
        )}

        {/* Phase filters (explore tab only) */}
        {tab === 'explore' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }} className="no-scrollbar">
            {PHASE_FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                active={phaseFilter === f.id}
                onClick={() => setPhaseFilter(f.id)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 280, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              {tab === 'mine' ? 'Todavia no participas en ningun proyecto' : 'No hay proyectos con esos filtros'}
            </p>
            {user && tab === 'mine' && (
              <Link
                to="/proyectos/nueva"
                style={{
                  display: 'inline-block',
                  padding: '10px 22px',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  fontFamily: 'Satoshi, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Crear mi primer proyecto
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div
            ref={gridRef}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
          >
            {items.map((project) => (
              <div key={project.id} className="project-card-anim">
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
