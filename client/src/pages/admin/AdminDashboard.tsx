import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useAdminStats, useAdminDbStats, useCleanupInactiveProfiles } from '../../hooks/useAdmin.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import type { CollectionStat } from '../../services/adminService.js'

interface StatCardProps {
  label: string
  value: number | undefined
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={`stat-card p-6 rounded-xl border flex flex-col gap-2 ${
        accent
          ? 'bg-[var(--accent-muted)] border-[var(--accent)]/20'
          : 'bg-[var(--surface)] border-[var(--border)]'
      }`}
    >
      <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className={`font-display font-semibold text-4xl ${
          accent ? 'text-[var(--accent)]' : 'text-[var(--text)]'
        }`}
      >
        {value ?? '—'}
      </span>
      {sub && (
        <span className="font-sans text-xs text-[var(--text-muted)]">{sub}</span>
      )}
    </div>
  )
}

function StorageBar({ col, max }: { col: CollectionStat; max: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  const pct = max > 0 ? (col.sizeMb / max) * 100 : 0

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { width: `${pct}%` })
      return
    }
    gsap.fromTo(el, { width: '0%' }, { width: `${pct}%`, duration: 0.7, ease: 'expo.out', delay: 0.05 })
  }, [pct])

  return (
    <div className="storage-bar flex items-center gap-3">
      <span className="font-sans text-xs text-[var(--text-muted)] w-36 truncate flex-shrink-0" title={col.name}>
        {col.name}
      </span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ background: 'var(--accent)', width: 0 }}
        />
      </div>
      <span className="font-sans text-xs text-[var(--text-muted)] w-16 text-right flex-shrink-0">
        {col.sizeMb < 0.01 ? '<0.01' : col.sizeMb} MB
      </span>
      <span className="font-sans text-xs text-[var(--text-muted)] w-12 text-right flex-shrink-0">
        {col.count}
      </span>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()
  const { data: dbStats, isLoading: dbLoading } = useAdminDbStats()
  const { mutateAsync: cleanupInactive, isPending: cleaning } = useCleanupInactiveProfiles()
  const [cleanupMsg, setCleanupMsg] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)
  const storageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stats || !gridRef.current) return
    gsap.fromTo(
      gridRef.current.querySelectorAll('.stat-card'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'expo.out' },
    )
  }, [stats])

  useEffect(() => {
    if (!dbStats || !storageRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      storageRef.current.querySelectorAll('.storage-bar'),
      { x: -12, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'expo.out', delay: 0.1 },
    )
  }, [dbStats])

  async function handleCleanupInactive() {
    setCleanupMsg('')
    try {
      const result = await cleanupInactive()
      setCleanupMsg(`${result.deleted} perfil(es) eliminado(s)`)
    } catch (err) {
      setCleanupMsg(err instanceof Error ? err.message : 'Error al limpiar')
    }
  }

  const maxCollSizeMb = dbStats
    ? Math.max(...dbStats.collections.map((c) => c.sizeMb), 0.01)
    : 0.01

  return (
    <div className="flex flex-col gap-10">
      {/* Stats grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Usuarios" value={stats?.totalUsers} accent />
          <StatCard label="Perfiles activos" value={stats?.activeProfiles} sub={`${stats?.totalProfiles ?? 0} totales`} />
          <StatCard label="Eventos activos" value={stats?.activeEvents} sub={`${stats?.totalEvents ?? 0} totales`} />
          <StatCard label="Perfiles totales" value={stats?.totalProfiles} />
          <StatCard label="Nuevos esta semana" value={stats?.newUsersThisWeek} accent />
          <StatCard label="Nuevos este mes" value={stats?.newUsersThisMonth} />
          <StatCard label="Eventos totales" value={stats?.totalEvents} />
          <StatCard label="Perfiles ocultos" value={
            stats !== undefined ? stats.totalProfiles - stats.activeProfiles : undefined
          } />
        </div>
      )}

      {/* Storage monitor */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-[var(--text)] text-lg">Storage de base de datos</h3>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Se actualiza cada 30 segundos
            </p>
          </div>
          {dbStats && (
            <div className="flex gap-6 flex-shrink-0">
              {[
                { label: 'Data', val: dbStats.totalDataMb },
                { label: 'Storage', val: dbStats.totalStorageMb },
                { label: 'Indices', val: dbStats.totalIndexMb },
              ].map(({ label, val }) => (
                <div key={label} className="text-right">
                  <p className="font-display font-semibold text-[var(--text)] text-xl">{val} <span className="font-sans font-normal text-xs text-[var(--text-muted)]">MB</span></p>
                  <p className="font-sans text-xs text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {dbLoading ? (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dbStats?.collections.length ? (
          <div ref={storageRef} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-sans text-xs text-[var(--text-muted)] w-36">Coleccion</span>
              <span className="flex-1" />
              <span className="font-sans text-xs text-[var(--text-muted)] w-16 text-right">Tamaño</span>
              <span className="font-sans text-xs text-[var(--text-muted)] w-12 text-right">Docs</span>
            </div>
            {dbStats.collections.map((col) => (
              <StorageBar key={col.name} col={col} max={maxCollSizeMb} />
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-[var(--text-muted)]">Sin datos de colecciones.</p>
        )}

        {/* Recommendations */}
        {dbStats?.recommendations.length ? (
          <div className="flex flex-col gap-3">
            <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">Recomendaciones</p>
            {dbStats.recommendations.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]"
              >
                <span className="font-sans text-sm text-[var(--text)]">{r}</span>
                {r.includes('perfil') && (
                  <button
                    type="button"
                    disabled={cleaning}
                    onClick={handleCleanupInactive}
                    className="flex-shrink-0 font-sans text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {cleaning ? 'Limpiando…' : 'Limpiar'}
                  </button>
                )}
              </div>
            ))}
            {cleanupMsg && (
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1">{cleanupMsg}</p>
            )}
          </div>
        ) : dbStats ? (
          <p className="font-sans text-xs text-[var(--accent)] mt-2">Sin recomendaciones — todo en orden.</p>
        ) : null}
      </div>
    </div>
  )
}
