/**
 * ProjectDetail — detalle completo de un proyecto.
 * - Creador: ve panel de miembros + pendientes, puede aceptar/rechazar.
 * - Visitante: puede postularse o cancelar postulacion.
 * - Miembro: ve la lista de miembros activos y puede salir.
 * Incluye ProjectPhaseBar para visualizar la fase actual.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import gsap from 'gsap'
import {
  useProject, useApplyToProject, useCancelApply, useAcceptMember,
  useRemoveMember, useUpdateProject, usePublishProgress, useDeleteProgress,
  useMemberShareProgress, useCompleteProject, useProgressFeed,
} from '../hooks/useProjects.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { ProjectPhaseBar } from '../components/projects/ProjectPhaseBar.js'
import { ProjectPublishSheet } from '../components/projects/ProjectPublishSheet.js'
import { ProjectChat } from '../components/projects/ProjectChat.js'
import { Button } from '../components/ui/Button.js'
import { profilePath, toSlug } from '../utils/slug.js'
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion.js'
import { PROJECT_PHASES, PROJECT_PHASE_LABELS } from '@dj/shared'
import { getPuzzleCoverUrl } from '../components/projects/projectCoverAssets.js'
import type { ProjectMember, ProjectPhase } from '../types/index.js'

function parseProjectId(param: string): string {
  const match = param.match(/[0-9a-fA-F]{24}$/)
  return match ? match[0] : param
}

/* ── Member avatar ───────────────────────────────────────── */
function MemberAvatar({ member }: { member: ProjectMember }) {
  return (
    <Link
      to={profilePath(toSlug(member.artistName), member.profileId)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-elevated)' }}>
        {member.avatar ? (
          <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
              {member.artistName[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div>
        <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          {member.artistName}
          {member.isCreator && (
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--accent)', marginLeft: 6, letterSpacing: '0.05em' }}>
              Creador
            </span>
          )}
        </p>
        {member.role && !member.isCreator && (
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>
            {member.role}
          </p>
        )}
      </div>
    </Link>
  )
}

/* ── Phase selector (creator only) ──────────────────────── */
function PhaseSelector({ current, onChange }: { current: ProjectPhase; onChange: (p: ProjectPhase) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {PROJECT_PHASES.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 12,
            fontWeight: p === current ? 700 : 500,
            padding: '5px 12px',
            borderRadius: 'var(--radius-xl)',
            border: p === current ? 'none' : '1px solid var(--border)',
            background: p === current ? 'var(--accent)' : 'transparent',
            color: p === current ? 'var(--bg)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          {PROJECT_PHASE_LABELS[p]}
        </button>
      ))}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function ProjectDetail() {
  const { id: rawId } = useParams<{ id: string }>()
  const projectId = parseProjectId(rawId ?? '')
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [searchParams] = useSearchParams()
  const focusMembers  = searchParams.get('focus') === 'members'
  const highlightProfileId = searchParams.get('highlight') ?? null

  const { data: project, isLoading } = useProject(projectId)
  // Find active progress post for this project (for member share button)
  const { data: progressFeed }       = useProgressFeed()
  const { mutate: applyMutation,       isPending: applying   } = useApplyToProject(projectId)
  const { mutate: cancelMutation,      isPending: cancelling } = useCancelApply(projectId)
  const { mutate: acceptMutation,      isPending: accepting  } = useAcceptMember(projectId)
  const { mutate: kickMutation                               } = useRemoveMember(projectId)
  const { mutate: updateMutation                             } = useUpdateProject(projectId)
  const { mutate: deleteProg                                 } = useDeleteProgress(projectId)
  const { mutate: memberShare,         isPending: sharing    } = useMemberShareProgress(projectId)
  const { mutate: completeProj,        isPending: completing } = useCompleteProject(projectId)

  const [applyMsg, setApplyMsg]           = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [showPublishSheet, setShowPublishSheet] = useState(false)
  const [activePostId, setActivePostId]   = useState<string | null>(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const pageRef       = useRef<HTMLDivElement>(null)
  const membersPanelRef = useRef<HTMLDivElement>(null)

  const isOwner  = Boolean(user && project?.userId === user.id)
  const isMember = Boolean(project?.isMember)

  // Active progress post for this project (used by member share button)
  const activeProgressPost = progressFeed?.find((p) => p.projectId === projectId)

  useEffect(() => {
    if (!pageRef.current || prefersReducedMotion()) return
    gsap.fromTo(pageRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.softOut })
  }, [])

  // Scroll al panel de miembros y resaltar el postulante si viene de un attachment de chat
  useEffect(() => {
    if (!focusMembers || !membersPanelRef.current) return
    const timeout = setTimeout(() => {
      membersPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      if (highlightProfileId) {
        const row = membersPanelRef.current?.querySelector(`[data-profile-id="${highlightProfileId}"]`) as HTMLElement | null
        if (row && !prefersReducedMotion()) {
          gsap.fromTo(
            row,
            { boxShadow: '0 0 0 2px var(--accent)', background: 'rgba(212,255,0,0.08)' },
            {
              boxShadow: '0 0 0 0px transparent',
              background: 'transparent',
              duration: 2.4,
              ease: 'power2.out',
              delay: 0.4,
            },
          )
        }
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [focusMembers, highlightProfileId])

  if (isLoading) {
    return (
      <div style={{ padding: 'calc(var(--header-h, 72px) + 24px) 20px 48px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ height: 240, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', animation: 'shimmer 1.5s ease-in-out infinite', marginBottom: 16 }} />
        <div style={{ height: 24, borderRadius: 8, background: 'var(--surface)', animation: 'shimmer 1.5s ease-in-out infinite', width: '60%', marginBottom: 8 }} />
        <div style={{ height: 14, borderRadius: 8, background: 'var(--surface)', animation: 'shimmer 1.5s ease-in-out infinite', width: '40%' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: 'calc(var(--header-h, 72px) + 48px) 20px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Proyecto no encontrado
        </p>
        <button type="button" onClick={() => navigate('/proyectos')} style={{ marginTop: 16, fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Ver todos los proyectos
        </button>
      </div>
    )
  }

  return (
    <div ref={pageRef} style={{ maxWidth: 720, margin: '0 auto', padding: 'calc(var(--header-h, 72px) + 16px) 20px 80px', minHeight: '100dvh' }}>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 20, transition: 'color 180ms' }}
        onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Proyectos
      </button>

      {/* Cover — Cloudinary URL o ilustracion puzzle */}
      {(() => {
        const coverUrl = project.cover ?? getPuzzleCoverUrl(project.coverSvgKey)
        return coverUrl ? (
          <div style={{ width: '100%', aspectRatio: '16/6', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 24 }}>
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : null
      })()}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        {/* Creator */}
        <Link to={profilePath(toSlug(project.artistName), project.profileId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-elevated)', flexShrink: 0 }}>
            {project.avatar ? (
              <img src={project.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{project.artistName[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>{project.artistName}</span>
        </Link>

        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {project.title}
        </h1>

        {/* Phase bar */}
        <ProjectPhaseBar phase={project.phase} />

        {/* Creator: phase selector + publish progress */}
        {isOwner && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Actualizar fase
              </p>
              <PhaseSelector
                current={project.phase}
                onChange={(p) => updateMutation({ phase: p })}
              />
            </div>

            {/* Publish progress button + active post indicator */}
            {activePostId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--accent-muted)', border: '1px solid rgba(212,255,0,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--accent)', flex: 1 }}>
                  Avance publicado (4h)
                </span>
                <button
                  type="button"
                  onClick={() => { deleteProg(activePostId); setActivePostId(null) }}
                  style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPublishSheet(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600,
                  padding: '8px 16px', borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  alignSelf: 'flex-start', transition: 'border-color 180ms, color 180ms',
                }}
                onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Publicar progreso actual
              </button>
            )}
          </div>
        )}

        {/* Member: share to profile button (visible when creator published an active post) */}
        {!isOwner && isMember && activeProgressPost && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => memberShare(activeProgressPost.id)}
              disabled={sharing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600,
                padding: '8px 16px', borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(167,139,250,0.4)',
                background: 'rgba(167,139,250,0.10)',
                color: 'var(--c-purple, #a78bfa)', cursor: sharing ? 'wait' : 'pointer',
                transition: 'opacity 150ms', opacity: sharing ? 0.6 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {sharing ? 'Compartiendo...' : 'Compartir avance en mi perfil'}
            </button>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Aparecera en tu seccion de Collabs
            </p>
          </div>
        )}
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-xl)', background: project.status === 'open' ? 'rgba(45,212,191,0.12)' : 'var(--surface)', color: project.status === 'open' ? '#2dd4bf' : 'var(--text-muted)', border: `1px solid ${project.status === 'open' ? 'rgba(45,212,191,0.25)' : 'var(--border)'}` }}>
          {project.status === 'open' ? 'Abierto' : 'Cerrado'}
        </span>
        {project.location && (
          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            {project.location}
          </span>
        )}
        {project.memberCount > 0 && (
          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            {project.memberCount} miembro{project.memberCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: '0 0 28px', maxWidth: 65 + 'ch' }}>
          {project.description}
        </p>
      )}

      {/* Roles */}
      {project.lookingForRoles.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Buscando
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {project.lookingForRoles.map((role) => (
              <span key={role} style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--radius-xl)', background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid rgba(212,255,0,0.2)' }}>
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Members panel */}
      {project.members && project.members.length > 0 && (
        <div ref={membersPanelRef} style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Miembros
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {project.members.filter((m) => m.status === 'member').map((m) => (
              <div
                key={m.id}
                data-profile-id={m.profileId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderRadius: 'var(--radius-md)', padding: '6px 10px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  transition: 'background 0.2s ease', minWidth: 0,
                }}
              >
                <MemberAvatar member={m} />
                {(isOwner && !m.isCreator) || (!isOwner && m.userId === user?.id && !m.isCreator) ? (
                  <button
                    type="button"
                    onClick={() => kickMutation(m.id)}
                    title={isOwner ? 'Quitar miembro' : 'Salir del proyecto'}
                    style={{
                      fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)',
                      background: 'none', border: 'none', borderRadius: 'var(--radius-xl)',
                      padding: '2px 6px', cursor: 'pointer', flexShrink: 0,
                      opacity: 0.6, transition: 'opacity 150ms',
                    }}
                    onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6' }}
                  >
                    {isOwner ? 'Quitar' : 'Salir'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Pending applicants (owner only) */}
          {isOwner && project.members.some((m) => m.status === 'pending') && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--c-orange, #fb923c)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                Solicitudes pendientes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {project.members.filter((m) => m.status === 'pending').map((m) => (
                  <div key={m.id} data-profile-id={m.profileId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 'var(--radius-md)', padding: '4px 6px', transition: 'background 0.3s ease' }}>
                    <MemberAvatar member={m} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => acceptMutation(m.id)}
                        disabled={accepting}
                        style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--radius-xl)', border: 'none', background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer' }}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => kickMutation(m.id)}
                        style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA — apply / cancel / already member */}
      {user && !isOwner && (
        <div style={{ paddingTop: 8 }}>
          {isMember ? (
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--accent)' }}>
              Sos parte de este proyecto.
            </p>
          ) : project.isApplied ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Solicitud enviada. Esperando respuesta del creador.
              </p>
              <button
                type="button"
                onClick={() => cancelMutation()}
                disabled={cancelling}
                style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancelar solicitud
              </button>
            </div>
          ) : project.status === 'open' ? (
            showApplyForm ? (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Mensaje al creador (opcional)
                </p>
                <textarea
                  value={applyMsg}
                  onChange={(e) => setApplyMsg(e.target.value)}
                  placeholder="Contales quien sos y por que te interesa unirte..."
                  maxLength={280}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-elevated)', color: 'var(--text)', fontFamily: 'Satoshi, sans-serif', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <Button
                    type="button"
                    disabled={applying}
                    onClick={() => applyMutation({ message: applyMsg.trim() || undefined }, { onSuccess: () => setShowApplyForm(false) })}
                  >
                    {applying ? 'Enviando...' : 'Solicitar ingreso'}
                  </Button>
                  <button type="button" onClick={() => setShowApplyForm(false)} style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <Button type="button" onClick={() => setShowApplyForm(true)}>
                Quiero unirme
              </Button>
            )
          ) : (
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--text-muted)' }}>
              Este proyecto ya no acepta nuevos integrantes.
            </p>
          )}
        </div>
      )}

      {/* Owner controls */}
      {isOwner && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to={`/proyectos/${projectId}/editar`}
              style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none', transition: 'border-color 180ms, color 180ms' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              Editar
            </Link>
            {project.status === 'open' ? (
              <button
                type="button"
                onClick={() => updateMutation({ status: 'closed' })}
                style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cerrar convocatoria
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateMutation({ status: 'open' })}
                style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(212,255,0,0.3)', background: 'var(--accent-muted)', color: 'var(--accent)', cursor: 'pointer' }}
              >
                Reabrir convocatoria
              </button>
            )}
          </div>

          {/* Finalize project button (only when phase is 'released') */}
          {project.phase === 'released' && project.status !== 'closed' && (
            !showCompleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 'var(--radius-xl)', border: 'none', background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer', alignSelf: 'flex-start' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Marcar como finalizado
              </button>
            ) : (
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,255,0,0.3)', background: 'var(--accent-muted)' }}>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--text)', margin: '0 0 12px', fontWeight: 600 }}>
                  Confirmar finalizacion del proyecto
                </p>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                  Se crearan colaboraciones verificadas para todos los miembros y aparecera en el feed.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { completeProj(); setShowCompleteConfirm(false) }}
                    disabled={completing}
                    style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 'var(--radius-xl)', border: 'none', background: 'var(--accent)', color: 'var(--bg)', cursor: 'pointer' }}
                  >
                    {completing ? 'Finalizando...' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompleteConfirm(false)}
                    style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, padding: '8px 14px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Chat interno del equipo (solo miembros activos o creador) */}
      {(isOwner || isMember) && (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Chat del equipo
          </p>
          <ProjectChat projectId={projectId} />
        </div>
      )}

      {/* Publish progress sheet */}
      {showPublishSheet && (
        <ProjectPublishSheet
          projectId={projectId}
          phase={project.phase}
          onClose={() => setShowPublishSheet(false)}
          onPublished={(postId) => setActivePostId(postId)}
        />
      )}
    </div>
  )
}
