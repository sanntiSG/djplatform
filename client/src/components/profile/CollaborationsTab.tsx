import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collaborationsService, type RequestCollabInput, type CollaborationItem } from '../../services/collaborationsService.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { Button } from '../ui/Button.js'
import { cn } from '../../utils/cn.js'

const TYPE_LABEL: Record<string, string> = {
  track: 'Track',
  event: 'Evento',
  visual: 'Visual',
  other: 'Otro',
  opportunity: 'Oportunidad',
}

function CollabCard({ collab, myProfileId, onRemove, removing }: {
  collab: CollaborationItem
  myProfileId?: string
  onRemove?: (id: string) => void
  removing?: boolean
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const isMine = myProfileId === collab.fromProfileId || myProfileId === collab.toProfileId
  const partnerName = myProfileId === collab.fromProfileId ? collab.toArtistName : collab.fromArtistName
  const partnerAvatar = myProfileId === collab.fromProfileId ? collab.toAvatar : collab.fromAvatar

  return (
    <div
      className="flex items-start gap-4 py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Partner avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
        {partnerAvatar ? (
          <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
            <span className="font-display text-sm font-bold text-[var(--text-muted)]">{partnerName.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-sans text-sm font-medium text-[var(--text)]">
            {collab.fromArtistName}
          </span>
          <span className="font-sans text-[11px] text-[var(--text-muted)]">+</span>
          <span className="font-sans text-sm font-medium text-[var(--text)]">
            {collab.toArtistName}
          </span>
        </div>
        <p className="font-sans text-sm text-[var(--text)] font-semibold leading-tight mb-1">
          {collab.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {collab.type && collab.type !== 'opportunity' && (
            <span
              className="font-sans text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(212,255,0,0.08)', color: 'var(--accent)' }}
            >
              {TYPE_LABEL[collab.type] ?? collab.type}
            </span>
          )}
          {collab.type === 'opportunity' && collab.opportunityId && (
            <Link
              to={`/oportunidades/${collab.opportunityId}`}
              className="font-sans text-[10px] font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-70"
              style={{ background: 'rgba(212,255,0,0.08)', color: 'var(--accent)' }}
            >
              via Oportunidad
            </Link>
          )}
          {collab.year && (
            <span className="font-sans text-[11px] text-[var(--text-muted)]">{collab.year}</span>
          )}
          {collab.isConfirmed && (
            <span
              className="font-sans text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
            >
              Verificada
            </span>
          )}
          {!collab.isConfirmed && isMine && (
            <span className="font-sans text-[11px] text-[var(--text-muted)]">Pendiente</span>
          )}
        </div>
      </div>

      {isMine && onRemove && (
        <div className="flex-shrink-0 flex items-center">
          {confirmingRemove ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { onRemove(collab.id); setConfirmingRemove(false) }}
                disabled={removing}
                className="font-sans text-[11px] font-medium text-[var(--c-red)] hover:opacity-75 transition-opacity disabled:opacity-40"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmingRemove(false)}
                className="font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRemove(true)}
              className={cn(
                'font-sans text-[11px] text-[var(--text-muted)] hover:text-[var(--c-red)] transition-colors',
                removing && 'opacity-40 pointer-events-none',
              )}
            >
              Quitar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RequestForm({ profileId, onSuccess }: { profileId: string; onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [type, setType] = useState<RequestCollabInput['type']>(undefined)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => collaborationsService.request({ toProfileId: profileId, title, year: year ? Number(year) : undefined, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations', profileId] })
      onSuccess()
    },
  })

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{ background: 'var(--surface-elevated)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="font-sans font-semibold text-sm text-[var(--text)] mb-4">Proponer colaboracion</p>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Nombre del track, evento o proyecto..."
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-2.5 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Ano"
            min={1990}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-24 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] rounded-xl px-3 py-2.5 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }}
          />
          <select
            value={type ?? ''}
            onChange={(e) => setType((e.target.value as RequestCollabInput['type']) || undefined)}
            className="flex-1 font-sans text-sm text-[var(--text)] rounded-xl px-3 py-2.5 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <option value="">Tipo (opcional)</option>
            <option value="track">Track</option>
            <option value="event">Evento</option>
            <option value="visual">Visual</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            loading={mutation.isPending}
            disabled={!title.trim()}
            onClick={() => mutation.mutate()}
          >
            Enviar solicitud
          </Button>
          <Button variant="ghost" size="sm" onClick={onSuccess}>
            Cancelar
          </Button>
        </div>
        {mutation.isError && (
          <p className="font-sans text-xs text-[var(--c-red)]">{(mutation.error as Error).message}</p>
        )}
      </div>
    </div>
  )
}

export function CollaborationsTab({ profileId, isOwner }: { profileId: string; isOwner: boolean }) {
  const { user } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: collabs, isLoading } = useQuery({
    queryKey: ['collaborations', profileId],
    queryFn: () => collaborationsService.listForProfile(profileId),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => collaborationsService.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collaborations', profileId] }),
  })

  const confirmed = collabs?.filter((c) => c.isConfirmed) ?? []
  const pending = collabs?.filter((c) => !c.isConfirmed) ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      {/* CTA for logged-in non-owners */}
      {user && !isOwner && (
        <div className="mb-6">
          {showForm ? (
            <RequestForm profileId={profileId} onSuccess={() => setShowForm(false)} />
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Proponer colaboracion
            </Button>
          )}
        </div>
      )}

      {/* Confirmed collaborations */}
      {confirmed.length > 0 && (
        <div className="mb-6">
          <p className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Colaboraciones verificadas
          </p>
          {confirmed.map((c) => (
            <CollabCard
              key={c.id}
              collab={c}
              myProfileId={isOwner ? profileId : undefined}
              onRemove={isOwner ? (id) => removeMutation.mutate(id) : undefined}
              removing={removeMutation.isPending && removeMutation.variables === c.id}
            />
          ))}
        </div>
      )}

      {/* Pending (owner-only) */}
      {isOwner && pending.length > 0 && (
        <div>
          <p className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
            Pendientes de confirmacion
          </p>
          {pending.map((c) => (
            <CollabCard
              key={c.id}
              collab={c}
              myProfileId={profileId}
              onRemove={(id) => removeMutation.mutate(id)}
              removing={removeMutation.isPending && removeMutation.variables === c.id}
            />
          ))}
        </div>
      )}

      {confirmed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="font-sans text-sm text-[var(--text-muted)]">
            Sin colaboraciones verificadas todavia.
          </p>
        </div>
      )}
    </div>
  )
}
