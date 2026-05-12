import { useRef, useEffect, useState } from 'react'
import type React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import gsap from 'gsap'
import { adminService, type AdminNotificationType } from '../../services/adminService.js'
import { Toggle } from '../../components/ui/Toggle.js'
import { Button } from '../../components/ui/Button.js'
import { Pill } from '../../components/ui/Pill.js'
import { useCounterTween } from '../../hooks/useCounterTween.js'
import { revealStagger, DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'

export default function AdminNotifications() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-notification-types'],
    queryFn: () => adminService.getNotificationTypes(),
  })

  const update = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminService.updateNotificationType(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notification-types'] }),
  })

  const bulk = useMutation({
    mutationFn: (enabled: boolean) => adminService.bulkUpdateNotificationTypes(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notification-types'] }),
  })

  const [bulkConfirm, setBulkConfirm] = useState<'activate' | 'deactivate' | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current || isLoading) return
    const items = listRef.current.querySelectorAll('[data-type-row]')
    if (!items.length) return
    const st = revealStagger(items, listRef.current, { y: 16, stagger: 0.04 })
    return () => st.kill()
  }, [isLoading])

  function handleToggle(type: AdminNotificationType) {
    const newVal = !type.enabledByAdmin
    qc.setQueryData(['admin-notification-types'], (old: typeof data) => {
      if (!old) return old
      return {
        ...old,
        types: old.types.map(t => t.key === type.key ? { ...t, enabledByAdmin: newVal } : t),
        stats: {
          ...old.stats,
          active: old.stats.active + (newVal ? 1 : -1),
          inactive: old.stats.inactive + (newVal ? -1 : 1),
        },
      }
    })
    update.mutate({ key: type.key, enabled: newVal })
  }

  function handleBulk(enabled: boolean) {
    setBulkConfirm(null)
    bulk.mutate(enabled)
  }

  const types = data?.types ?? []
  const profileTypes = types.filter(t => t.category === 'profile')
  const allTypes = types.filter(t => t.category === 'all')
  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0 }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Activos" value={stats.active} accent />
        <StatCard label="Inactivos" value={stats.inactive} />
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-[var(--text-muted)] font-medium">Acciones:</span>
        {bulkConfirm === 'activate' ? (
          <BulkConfirm
            label="Confirmar activar todos"
            onConfirm={() => handleBulk(true)}
            onCancel={() => setBulkConfirm(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setBulkConfirm('activate')}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-75 transition-opacity"
          >
            Activar todos
          </button>
        )}
        <span className="text-[var(--border)] text-sm">|</span>
        {bulkConfirm === 'deactivate' ? (
          <BulkConfirm
            label="Confirmar desactivar todos"
            onConfirm={() => handleBulk(false)}
            onCancel={() => setBulkConfirm(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setBulkConfirm('deactivate')}
            className="text-sm font-medium text-white/50 hover:text-[var(--text)] transition-colors"
          >
            Desactivar todos
          </button>
        )}
      </div>

      {isLoading && <TypeListSkeleton />}

      <div ref={listRef} className="flex flex-col gap-8">
        {/* Profile category */}
        {profileTypes.length > 0 && (
          <section>
            <CategoryHeader label="Perfil" description="Notificaciones de seguidores y reacciones — disponibles para todos los usuarios." />
            <div className="flex flex-col gap-2 mt-4">
              {profileTypes.map(t => (
                <TypeRow key={t.key} type={t} onToggle={() => handleToggle(t)} />
              ))}
            </div>
          </section>
        )}

        {/* All category */}
        {allTypes.length > 0 && (
          <section>
            <CategoryHeader label="Actividad extendida" description='Solo para usuarios con nivel "Todas". Incluye eventos, musica y chat.' />
            <div className="flex flex-col gap-2 mt-4">
              {allTypes.map(t => (
                <TypeRow key={t.key} type={t} onToggle={() => handleToggle(t)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const ref = useCounterTween(0, value, { duration: 0.8 })
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-1">
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className={cn('font-display font-semibold text-3xl', accent ? 'text-[var(--accent)]' : 'text-[var(--text)]')}
      />
      <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
    </div>
  )
}

function CategoryHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="text-xs text-[var(--text-muted)] opacity-70 leading-relaxed">{description}</p>
    </div>
  )
}

function TypeRow({ type, onToggle }: { type: AdminNotificationType; onToggle: () => void }) {
  const rowRef = useRef<HTMLDivElement>(null)

  function handleToggle() {
    const row = rowRef.current
    if (!row || prefersReducedMotion()) { onToggle(); return }
    gsap.to(row, {
      opacity: !type.enabledByAdmin ? 1 : 0.45,
      duration: DURATION.base,
      ease: EASE.inOut,
    })
    onToggle()
  }

  return (
    <div
      ref={rowRef}
      data-type-row
      className="flex items-center justify-between gap-4 bg-[var(--surface)] rounded-[var(--radius-md)] px-5 py-3.5 transition-opacity duration-200"
      style={{ opacity: type.enabledByAdmin ? 1 : 0.45 }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--text)]">{type.label}</span>
            <Pill
              label={type.category === 'profile' ? 'perfil' : 'todas'}
              variant="contact"
              className="text-[10px]"
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] leading-relaxed">{type.description}</span>
        </div>
      </div>
      <Toggle
        checked={type.enabledByAdmin}
        onChange={handleToggle}
      />
    </div>
  )
}

function BulkConfirm({ label, onConfirm, onCancel }: {
  label: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" size="sm" onClick={onConfirm}>{label}</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
    </div>
  )
}

function TypeListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-[var(--radius-md)] skeleton-shimmer" />
      ))}
    </div>
  )
}
