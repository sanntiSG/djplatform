import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useEffect, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { opportunityService, type OpportunityApplicant } from '../services/opportunityService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { Button } from '../components/ui/Button.js'
import { roleLabel } from '@dj/shared'
import { prefersReducedMotion, EASE, DURATION, STAGGER } from '../utils/motion.js'
import { useOpportunityRealtime } from '../hooks/useOpportunityRealtime.js'

function ApplicantsList({
  applicants,
  oppStatus,
  onAccept,
  accepting,
  containerRef,
}: {
  applicants: OpportunityApplicant[]
  oppStatus: 'open' | 'closed' | 'filled'
  onAccept: (profileId: string) => void
  accepting: boolean
  containerRef: RefObject<HTMLDivElement>
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const el = listRef.current
    if (!el || reduced) return
    const cards = el.querySelectorAll('.applicant-card')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut, stagger: STAGGER.base, clearProps: 'transform' },
    )
  }, [applicants.length, reduced])

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 mb-8 transition-shadow duration-300"
    >
      <p className="font-sans text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-4">
        Interesados ({applicants.length})
      </p>
      <div ref={listRef} className="flex flex-col gap-3">
        {applicants.map((a) => (
          <div
            key={a.id}
            className="applicant-card flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <Link
              to={`/p/${a.slug}-${a.id}`}
              className="flex items-center gap-3 min-w-0 group"
            >
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt={a.artistName}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 group-hover:ring-[var(--accent)] transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center ring-1 ring-white/10 flex-shrink-0 group-hover:ring-[var(--accent)] transition-all">
                  <span className="font-display text-xs font-semibold text-[var(--text-muted)]">
                    {a.artistName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-[var(--text)] truncate">{a.artistName}</p>
                <p className="font-sans text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                  Ver perfil
                </p>
              </div>
            </Link>
            {oppStatus === 'open' && (
              <Button
                variant="outline"
                size="sm"
                loading={accepting}
                onClick={() => onAccept(a.id)}
              >
                Aceptar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const applicantsRef = useRef<HTMLDivElement>(null)

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunityService.getById(id!),
    enabled: !!id,
  })

  const applyMutation = useMutation({
    mutationFn: () => opportunityService.apply(id!, applyMessage.trim() || undefined),
    onSuccess: (data) => {
      setShowApplyModal(false)
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

  const acceptCollabMutation = useMutation({
    mutationFn: (collaboratorProfileId: string) =>
      opportunityService.acceptCollab(id!, { collaboratorProfileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
    },
  })

  useOpportunityRealtime(id ?? '')

  /* Highlight applicants section when navigating from notification */
  useEffect(() => {
    if (searchParams.get('focus') !== 'applicants') return
    const el = applicantsRef.current
    if (!el) return
    const reduced = prefersReducedMotion()
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    if (!reduced) {
      gsap.fromTo(
        el,
        { boxShadow: '0 0 0 2px var(--accent)' },
        { boxShadow: '0 0 0 0px transparent', duration: 1.2, ease: 'power2.out', delay: 0.4 },
      )
    }
  }, [searchParams, opp])

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

  return (
    <>
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
                {roleLabel(r)}
              </span>
            ))}
            {opp.isPaid && (
              <span className="rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--c-teal-muted)] text-[var(--c-teal)]">Pago</span>
            )}
            {opp.isRemote && (
              <span className="rounded-full px-3 py-1 font-sans text-xs font-medium bg-[var(--c-purple-muted)] text-[var(--c-purple)]">Remoto</span>
            )}
          </div>

          {/* Description */}
          {opp.description && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 mb-8">
              <p className="font-sans text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">{opp.description}</p>
            </div>
          )}

          {/* Applicants — visible only to owner */}
          {isOwner && opp.applicants && opp.applicants.length > 0 ? (
            <ApplicantsList
              applicants={opp.applicants}
              oppStatus={opp.status}
              onAccept={(profileId) => acceptCollabMutation.mutate(profileId)}
              accepting={acceptCollabMutation.isPending}
              containerRef={applicantsRef}
            />
          ) : (
            opp.applicantCount > 0 && !isOwner && (
              <p className="font-sans text-xs text-[var(--text-muted)] mb-6">
                {opp.applicantCount} {opp.applicantCount === 1 ? 'persona interesada' : 'personas interesadas'}
              </p>
            )
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!isOwner && user && opp.status === 'open' && (
              <Button
                variant="primary"
                size="md"
                disabled={opp.isApplied}
                onClick={() => !opp.isApplied && setShowApplyModal(true)}
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
                  if (confirm('Eliminar esta oportunidad? Se notificara a los postulantes.')) deleteMutation.mutate()
                }}
                className="text-[var(--c-red)] hover:text-[var(--c-red)]"
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowApplyModal(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 flex flex-col gap-5">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Postularte a</p>
              <h2 className="font-display font-semibold text-[var(--text)] leading-snug" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                {opp.title}
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs text-[var(--text-muted)]">
                Mensaje (opcional, max 280 caracteres)
              </label>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value.slice(0, 280))}
                placeholder={`Hola ${opp.artistName}, me interesa tu oportunidad...`}
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 resize-none transition-colors duration-200"
              />
              <p className="font-sans text-[10px] text-[var(--text-muted)] text-right">{applyMessage.length}/280</p>
            </div>

            {applyMutation.isError && (
              <p className="font-sans text-xs text-[var(--c-red)]">Ocurrio un error. Intenta de nuevo.</p>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => setShowApplyModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={applyMutation.isPending}
                onClick={() => applyMutation.mutate()}
                className="flex-1"
              >
                Enviar postulacion
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
