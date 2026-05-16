import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { opportunityService } from '../services/opportunityService.js'
import { OpportunityCard } from '../components/opportunities/OpportunityCard.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { Button } from '../components/ui/Button.js'
import { prefersReducedMotion } from '../utils/motion.js'
import { cn } from '../utils/cn.js'

gsap.registerPlugin(ScrollTrigger)

const ROLE_FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'dj', label: 'DJ' },
  { id: 'producer', label: 'Productor' },
  { id: 'vocalist', label: 'Vocalista' },
  { id: 'designer', label: 'Disenador' },
  { id: 'organizer', label: 'Organizador' },
  { id: 'visuals', label: 'Visuales' },
]

export default function Opportunities() {
  const { user } = useAuthStore()
  const [roleFilter, setRoleFilter] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [paidOnly, setPaidOnly] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities', roleFilter, remoteOnly, paidOnly],
    queryFn: () => opportunityService.list({
      role: roleFilter || undefined,
      isRemote: remoteOnly || undefined,
      isPaid: paidOnly || undefined,
    }),
  })

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !opportunities?.length || prefersReducedMotion()) return
    const cards = grid.querySelectorAll('.opp-card')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.07,
        duration: 0.55,
        ease: 'expo.out',
        clearProps: 'transform,opacity',
      },
    )
  }, [opportunities])

  return (
    <div className="min-h-screen bg-[var(--bg)] md:pt-16">
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
            <p className="font-sans text-sm text-[var(--text-muted)] mt-2 max-w-[46ch]">
              Colaboraciones, proyectos y pedidos de la comunidad REsonar.
            </p>
          </div>
          {user && (
            <Link to="/oportunidades/nueva">
              <Button variant="primary" size="sm">Publicar</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3">
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
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        {isLoading ? (
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
              <Link to="/oportunidades/nueva">
                <Button variant="outline" size="sm">Ser el primero</Button>
              </Link>
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
        )}
      </div>
    </div>
  )
}
