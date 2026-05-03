import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useAdminStats } from '../../hooks/useAdmin.js'

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

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats()
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stats || !gridRef.current) return
    gsap.fromTo(
      gridRef.current.querySelectorAll('.stat-card'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'expo.out' },
    )
  }, [stats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
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
  )
}
