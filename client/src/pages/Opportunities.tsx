/**
 * Opportunities — listado de oportunidades + tab Proyectos.
 * El CTA "Publicar" abre un sheet que diferencia entre Oportunidad y Proyecto,
 * explicando las diferencias antes de derivar al formulario correspondiente.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { opportunityService } from '../services/opportunityService.js'
import { OpportunityCard } from '../components/opportunities/OpportunityCard.js'
import { ProjectCard } from '../components/projects/ProjectCard.js'
import { useProjectList } from '../hooks/useProjects.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { Button } from '../components/ui/Button.js'
import { prefersReducedMotion, DURATION, EASE } from '../utils/motion.js'
import { cn } from '../utils/cn.js'
import { ROLE_OPTIONS, PROJECT_PHASES, PROJECT_PHASE_LABELS } from '@dj/shared'
import type { ProjectPhase } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

const ROLE_FILTERS = [
  { id: '', label: 'Todos' },
  ...ROLE_OPTIONS.map((r) => ({ id: r.id, label: r.label })),
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Postulado',  color: 'var(--accent)',    bg: 'var(--accent-muted)' },
  accepted: { label: 'Aceptado',   color: 'var(--c-teal)',    bg: 'var(--c-teal-muted)' },
  closed:   { label: 'Cerrada',    color: 'var(--text-muted)', bg: 'var(--surface-elevated)' },
}

/* ── Publish type selector sheet ─────────────────────────── */

function PublishTypeSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    if (!sheet || !overlay || prefersReducedMotion()) return
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: DURATION.base, ease: EASE.out })
    gsap.fromTo(sheet, { y: '100%' }, { y: 0, duration: DURATION.base, ease: EASE.softOut })
  }, [])

  const close = useCallback(() => {
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    if (!sheet || !overlay || prefersReducedMotion()) { onClose(); return }
    gsap.to([overlay], { opacity: 0, duration: DURATION.micro, ease: EASE.softIn })
    gsap.to(sheet, {
      y: '100%',
      duration: DURATION.micro,
      ease: EASE.softIn,
      onComplete: onClose,
    })
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 70,
        }}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 71,
          background: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          padding: 'calc(24px + env(safe-area-inset-top, 0px)) 20px calc(32px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />

        <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Que queres publicar?
        </h2>
        <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
          Elige el tipo de publicacion que mejor describe lo que buscas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Oportunidad */}
          <button
            type="button"
            onClick={() => { close(); setTimeout(() => navigate('/oportunidades/nueva'), 150) }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '16px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.18s ease',
              width: '100%',
            }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>
                Oportunidad
              </p>
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Busco a alguien especifico. Una necesidad puntual donde eleges un postulante y la busqueda se cierra.
              </p>
            </div>
          </button>

          {/* Proyecto */}
          <button
            type="button"
            onClick={() => { close(); setTimeout(() => navigate('/proyectos/nueva'), 150) }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '16px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.18s ease',
              width: '100%',
            }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,0.4)' }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-purple, #a78bfa)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>
                Proyecto
              </p>
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Quiero construir algo colectivo. Un equipo que crece con el tiempo, con fases, sin fecha de cierre.
              </p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          style={{ display: 'block', width: '100%', marginTop: 16, fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
        >
          Cancelar
        </button>
      </div>
    </>
  )
}

/* ── Projects tab content ────────────────────────────────── */

function ProjectsTab() {
  const [phaseFilter, setPhaseFilter] = useState<ProjectPhase | ''>('')
  const { user } = useAuthStore()
  const gridRef = useRef<HTMLDivElement>(null)

  const { data: projects, isLoading } = useProjectList({
    phase: phaseFilter || undefined,
    status: 'open',
  })

  useEffect(() => {
    const el = gridRef.current
    if (!el || !projects?.length || prefersReducedMotion()) return
    const cards = el.querySelectorAll('.proj-card-anim')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.softOut, stagger: 0.05 },
    )
  }, [projects?.length, phaseFilter])

  return (
    <div>
      {/* Phase filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }} className="no-scrollbar">
        <button
          type="button"
          onClick={() => setPhaseFilter('')}
          style={{
            fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: phaseFilter === '' ? 700 : 500,
            padding: '6px 14px', borderRadius: 'var(--radius-xl)', flexShrink: 0,
            border: phaseFilter === '' ? 'none' : '1px solid var(--border)',
            background: phaseFilter === '' ? 'var(--accent)' : 'transparent',
            color: phaseFilter === '' ? 'var(--bg)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          Todas las fases
        </button>
        {PROJECT_PHASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhaseFilter(p)}
            style={{
              fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: phaseFilter === p ? 700 : 500,
              padding: '6px 14px', borderRadius: 'var(--radius-xl)', flexShrink: 0,
              border: phaseFilter === p ? 'none' : '1px solid var(--border)',
              background: phaseFilter === p ? 'var(--accent)' : 'transparent',
              color: phaseFilter === p ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 150ms',
            }}
          >
            {PROJECT_PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 280, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !projects?.length && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-sans text-sm text-[var(--text-muted)]">
            No hay proyectos con esa fase todavia.
          </p>
          {user && (
            <Link to="/proyectos/nueva">
              <Button variant="outline" size="sm">Crear el primero</Button>
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && projects && projects.length > 0 && (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="proj-card-anim">
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */

export default function Opportunities() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'explore' | 'mine' | 'projects'>('explore')
  const [roleFilter, setRoleFilter] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [paidOnly, setPaidOnly] = useState(false)
  const [showPublishSheet, setShowPublishSheet] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities', roleFilter, remoteOnly, paidOnly],
    queryFn: () => opportunityService.list({
      role: roleFilter || undefined,
      isRemote: remoteOnly || undefined,
      isPaid: paidOnly || undefined,
    }),
  })

  const { data: myApps, isLoading: myAppsLoading } = useQuery({
    queryKey: ['opportunities', 'me', 'applications'],
    queryFn: opportunityService.myApplications,
    enabled: !!user && tab === 'mine',
  })

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !opportunities?.length || prefersReducedMotion()) return
    const cards = grid.querySelectorAll('.opp-card')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, stagger: 0.07, duration: 0.55, ease: 'expo.out',
        clearProps: 'transform,opacity',
      },
    )
  }, [opportunities])

  const TABS: Array<[typeof tab, string]> = [
    ['explore', 'Oportunidades'],
    ['projects', 'Proyectos'],
    ...(user ? [['mine', 'Mis postulaciones'] as [typeof tab, string]] : []),
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] md:pt-16">
      {/* Publish type selector sheet */}
      {showPublishSheet && (
        <PublishTypeSheet onClose={() => setShowPublishSheet(false)} />
      )}

      {/* Hero strip */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-display font-semibold text-[var(--text)] leading-none tracking-tighter"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}
            >
              Oportunidades
            </h1>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-2 max-w-[52ch]">
              Colaboraciones, proyectos y pedidos de la comunidad REsonar.
            </p>
          </div>
          {user && (
            <Button variant="primary" size="sm" onClick={() => setShowPublishSheet(true)}>
              Publicar
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 p-1 rounded-xl bg-[var(--surface)] w-fit overflow-x-auto no-scrollbar">
          {TABS.map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-1.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 whitespace-nowrap',
                tab === t
                  ? 'bg-[var(--bg)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters — only in explore tab */}
        {tab === 'explore' && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {ROLE_FILTERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleFilter(r.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all duration-200 select-none',
                    roleFilter === r.id
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaidOnly((v) => !v)}
                className={cn(
                  'rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all duration-200 select-none',
                  paidOnly
                    ? 'bg-[var(--c-teal)] text-[var(--bg)]'
                    : 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                )}
              >
                Pago
              </button>
              <button
                type="button"
                onClick={() => setRemoteOnly((v) => !v)}
                className={cn(
                  'rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all duration-200 select-none',
                  remoteOnly
                    ? 'bg-[var(--c-purple)] text-[var(--bg)]'
                    : 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                )}
              >
                Remoto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        {/* Projects tab */}
        {tab === 'projects' && <ProjectsTab />}

        {/* My applications tab */}
        {tab === 'mine' && (
          myAppsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-52" />
              ))}
            </div>
          ) : !myApps?.length ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="font-sans text-sm text-[var(--text-muted)]">
                Todavia no te postulaste a ninguna oportunidad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myApps.map((o) => {
                const st = STATUS_LABELS[o.myApplicationStatus ?? 'pending']
                return (
                  <Link key={o.id} to={`/oportunidades/${o.id}`} className="opp-card block group">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 h-full hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="font-sans font-medium text-sm text-[var(--text)] line-clamp-2 leading-snug">
                          {o.title}
                        </p>
                        <span
                          className="flex-shrink-0 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-[var(--text-muted)] mb-1">{o.artistName}</p>
                      {o.location && (
                        <p className="font-sans text-xs text-[var(--text-muted)]">{o.location}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* Explore opportunities tab */}
        {tab === 'explore' && (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-52" />
              ))}
            </div>
          ) : !opportunities?.length ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="font-sans text-sm text-[var(--text-muted)]">
                No hay oportunidades publicadas todavia.
              </p>
              {user && (
                <Button variant="outline" size="sm" onClick={() => setShowPublishSheet(true)}>
                  Ser el primero
                </Button>
              )}
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {opportunities.map((o) => (
                <div key={o.id} className="opp-card">
                  <OpportunityCard opportunity={o} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
