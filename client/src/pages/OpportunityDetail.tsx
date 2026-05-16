import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityService } from '../services/opportunityService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { Button } from '../components/ui/Button.js'

const ROLE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  vocalist: 'Vocalista',
  designer: 'Disenador',
  organizer: 'Organizador',
  visuals: 'Visuales',
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunityService.getById(id!),
    enabled: !!id,
  })

  const applyMutation = useMutation({
    mutationFn: () => opportunityService.apply(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
      navigate(`/me/mensajes/${data.conversationId}`)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => opportunityService.update(id!, { status: 'filled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunity', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => opportunityService.remove(id!),
    onSuccess: () => navigate('/oportunidades'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <p className="font-display text-[var(--text-muted)] text-xl">No encontrada</p>
        <Link to="/oportunidades"><Button variant="outline" size="md">Volver</Button></Link>
      </div>
    )
  }

  const isOwner = user && opp.userId === user.id
  const date = opp.eventDate
    ? new Date(opp.eventDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-[var(--bg)] md:pt-16 px-5 sm:px-8 py-14">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to="/oportunidades" className="inline-flex items-center gap-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Oportunidades
        </Link>

        {/* Author */}
        <div className="flex items-center gap-3 mb-6">
          {opp.avatar ? (
            <img src={opp.avatar} alt={opp.artistName} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center ring-1 ring-white/10">
              <span className="font-display text-sm font-semibold text-[var(--text-muted)]">{opp.artistName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="font-sans text-sm font-medium text-[var(--text)]">{opp.artistName}</p>
            {opp.location && <p className="font-sans text-xs text-[var(--text-muted)]">{opp.location}</p>}
          </div>
          {opp.status !== 'open' && (
            <span className="ml-auto rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
              {opp.status === 'filled' ? 'Cubierta' : 'Cerrada'}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="font-display font-semibold text-[var(--text)] leading-tight tracking-tighter mb-4"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
        >
          {opp.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-6">
          {opp.lookingForRoles.map((r) => (
            <span key={r} className="rounded-full px-3 py-1 font-sans text-xs font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              {ROLE_LABEL[r] ?? r}
            </span>
          ))}
          {opp.isPaid && (
            <span className="rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--c-teal-muted)] text-[var(--c-teal)]">Pago</span>
          )}
          {opp.isRemote && (
            <span className="rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--c-purple-muted)] text-[var(--c-purple)]">Remoto</span>
          )}
          {date && (
            <span className="rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-muted)]">{date}</span>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <div
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 mb-8"
          >
            <p className="font-sans text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">{opp.description}</p>
          </div>
        )}

        {/* Stats */}
        {opp.applicantCount > 0 && (
          <p className="font-sans text-xs text-[var(--text-muted)] mb-6">
            {opp.applicantCount} {opp.applicantCount === 1 ? 'persona interesada' : 'personas interesadas'}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!isOwner && user && opp.status === 'open' && (
            <Button
              variant="primary"
              size="md"
              loading={applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
              disabled={opp.isApplied}
            >
              {opp.isApplied ? 'Ya te contactaste' : 'Aplicar / Contactar'}
            </Button>
          )}
          {!user && opp.status === 'open' && (
            <Link to="/auth/login">
              <Button variant="primary" size="md" className="w-full">Ingresar para aplicar</Button>
            </Link>
          )}
          {isOwner && opp.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              loading={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              Marcar como cubierta
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Eliminar esta oportunidad?')) deleteMutation.mutate()
              }}
              className="text-[var(--c-red)] hover:text-[var(--c-red)]"
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
