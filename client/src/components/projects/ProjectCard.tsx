/**
 * ProjectCard — tarjeta de un proyecto para el listado.
 * Muestra cover/avatar del creador, título, fase con ícono SVG, estado de miembros y roles buscados.
 */
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { PROJECT_PHASE_LABELS } from '@dj/shared'
import { useTapAnim } from '../../hooks/useTapAnim.js'
import { ProgressIcon, PHASE_SVG_MAP } from './ProjectProgressIcons.js'
import type { ProjectResponse } from '../../types/index.js'

/* ── Phase accent colors ─────────────────────────────────── */
const PHASE_COLOR: Record<string, string> = {
  idea:      'var(--c-purple, #a78bfa)',
  progress:  'var(--c-teal, #2dd4bf)',
  recording: 'var(--c-orange, #fb923c)',
  mixing:    'var(--c-pink, #f472b6)',
  released:  'var(--accent)',
}

export function ProjectCard({ project }: { project: ProjectResponse }) {
  const { ref, tapHandlers } = useTapAnim<HTMLAnchorElement>(0.97)
  const phaseColor = PHASE_COLOR[project.phase] ?? 'var(--accent)'

  return (
    <Link
      ref={ref}
      to={`/proyectos/${project.id}`}
      {...tapHandlers}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          transition: 'background 0.2s ease',
        }}
        onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-elevated)' }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
      >
        {/* Cover image or gradient fallback */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/7',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, var(--surface-elevated), var(--surface))',
          }}
        >
          {project.cover ? (
            <img
              src={project.cover}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${phaseColor}22, var(--surface) 70%)`,
              }}
            />
          )}

          {/* Phase pill + icon — top-right */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: 'var(--radius-xl)',
              background: `${phaseColor}22`,
              backdropFilter: 'blur(8px)',
              padding: '3px 9px 3px 7px',
            }}
          >
            <span style={{ color: phaseColor, lineHeight: 0, flexShrink: 0 }}>
              <ProgressIcon svgKey={PHASE_SVG_MAP[project.phase] ?? 'note'} size={13} />
            </span>
            <span
              style={{
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: phaseColor,
              }}
            >
              {PROJECT_PHASE_LABELS[project.phase]}
            </span>
          </div>

          {/* Open/closed badge — top-left */}
          {project.status === 'closed' && (
            <span
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Cerrado
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Creator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--surface-elevated)',
                flexShrink: 0,
              }}
            >
              {project.avatar ? (
                <img src={project.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {project.artistName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.artistName}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 'clamp(1rem, 3vw, 1.15rem)',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 10px',
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.title}
          </h3>

          {/* Roles looking for */}
          {project.lookingForRoles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {project.lookingForRoles.slice(0, 3).map((role) => (
                <span
                  key={role}
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--surface-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {role}
                </span>
              ))}
              {project.lookingForRoles.length > 3 && (
                <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  +{project.lookingForRoles.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer: member count + location */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
              {project.memberCount} miembro{project.memberCount !== 1 ? 's' : ''}
              {project.status === 'open' && project.pendingCount > 0 && (
                <span style={{ color: 'var(--accent)', marginLeft: 6 }}>
                  +{project.pendingCount} pendiente{project.pendingCount !== 1 ? 's' : ''}
                </span>
              )}
            </span>
            {project.location && (
              <span
                style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 120,
                }}
              >
                {project.location}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
