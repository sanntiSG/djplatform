/**
 * ProjectEdit — formulario de edicion de proyecto existente.
 * Pre-rellena todos los campos con los datos actuales del proyecto.
 * El submit llama useUpdateProject (PATCH /projects/:id).
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.js'
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete.js'
import { ProgressIcon, PROGRESS_SVGS } from '../components/projects/ProjectProgressIcons.js'
import { PUZZLE_COVERS } from '../components/projects/projectCoverAssets.js'
import { useProject, useUpdateProject } from '../hooks/useProjects.js'
import { PROJECT_PHASES, PROJECT_PHASE_LABELS, ROLE_OPTIONS } from '@dj/shared'
import type { ProjectPhase } from '../types/index.js'

const GENRE_OPTIONS = [
  'Techno', 'House', 'Deep House', 'Indie Rock', 'Jazz', 'Hip Hop', 'R&B',
  'Cumbia', 'Reggaeton', 'Drum & Bass', 'Ambient', 'Trance', 'Pop', 'Folk', 'Metal',
]

function parseProjectId(param: string): string {
  const match = param.match(/[0-9a-fA-F]{24}$/)
  return match ? match[0] : param
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'Satoshi, sans-serif',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.18s ease',
    boxSizing: 'border-box' as const,
  }
}

export default function ProjectEdit() {
  const { id: rawId } = useParams<{ id: string }>()
  const projectId = parseProjectId(rawId ?? '')
  const navigate = useNavigate()

  const { data: project, isLoading } = useProject(projectId)
  const { mutateAsync: updateProject } = useUpdateProject(projectId)

  const [title, setTitle]             = useState('')
  const [description, setDescription]  = useState('')
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([])
  const [genres, setGenres]           = useState<string[]>([])
  const [location, setLocation]       = useState('')
  const [phase, setPhase]             = useState<ProjectPhase>('idea')
  const [coverSvgKey, setCoverSvgKey]  = useState<string>('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [titleFocused, setTitleFocused] = useState(false)
  const [descFocused, setDescFocused]   = useState(false)

  // Pre-fill form when project data loads
  useEffect(() => {
    if (!project) return
    setTitle(project.title)
    setDescription(project.description ?? '')
    setLookingForRoles(project.lookingForRoles)
    setGenres(project.genres)
    setLocation(project.location ?? '')
    setPhase(project.phase)
    setCoverSvgKey(project.coverSvgKey ?? '')
  }, [project])

  function toggleRole(id: string) {
    setLookingForRoles((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])
  }

  function toggleGenre(g: string) {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El titulo es obligatorio'); return }
    setError('')
    setLoading(true)
    try {
      await updateProject({
        title:           title.trim(),
        description:     description.trim() || undefined,
        lookingForRoles,
        genres,
        location:        location.trim() || undefined,
        phase,
        coverSvgKey:     coverSvgKey || undefined,
      })
      navigate(`/proyectos/${projectId}`)
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(var(--header-h, 72px) + 24px) 20px 64px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 52, borderRadius: 12, background: 'var(--surface)', marginBottom: 16, animation: 'shimmer 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: 'calc(var(--header-h, 72px) + 48px) 20px' }}>
        <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'var(--text-muted)' }}>Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: 'calc(var(--header-h, 72px) + 24px) 20px 64px',
        minHeight: '100dvh',
      }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(`/proyectos/${projectId}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: 600,
          color: 'var(--text-muted)', background: 'none', border: 'none',
          cursor: 'pointer', padding: '4px 0', marginBottom: 24,
          transition: 'color 180ms',
        }}
        onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al proyecto
      </button>

      <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Editar proyecto
      </h1>
      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 32px' }}>
        Actualizá los datos de tu proyecto.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Title */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Nombre del proyecto *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            maxLength={120}
            style={inputStyle(titleFocused)}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Descripcion
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            maxLength={2000}
            rows={4}
            style={{ ...inputStyle(descFocused), resize: 'vertical', minHeight: 96 }}
          />
        </div>

        {/* Fase */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Fase actual
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROJECT_PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPhase(p)}
                style={{
                  fontFamily: 'Satoshi, sans-serif', fontSize: 13, fontWeight: phase === p ? 700 : 500,
                  padding: '7px 14px', borderRadius: 'var(--radius-xl)',
                  border: phase === p ? 'none' : '1px solid var(--border)',
                  background: phase === p ? 'var(--accent)' : 'transparent',
                  color: phase === p ? 'var(--bg)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'background 150ms, color 150ms',
                }}
              >
                {PROJECT_PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Roles que buscas
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array.from(ROLE_OPTIONS).map((r) => {
              const active = lookingForRoles.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  style={{
                    fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: active ? 700 : 500,
                    padding: '6px 12px', borderRadius: 'var(--radius-xl)',
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 150ms',
                    outline: active ? '1px solid rgba(212,255,0,0.3)' : 'none',
                  }}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Genres */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Generos musicales
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GENRE_OPTIONS.map((g) => {
              const active = genres.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  style={{
                    fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: active ? 700 : 500,
                    padding: '6px 12px', borderRadius: 'var(--radius-xl)',
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 150ms',
                    outline: active ? '1px solid rgba(212,255,0,0.3)' : 'none',
                  }}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Ubicacion (opcional)
          </label>
          <LocationAutocomplete
            value={location}
            onChange={(name) => setLocation(name)}
          />
        </div>

        {/* Portada del proyecto */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Portada del proyecto
          </label>

          {/* Grupo: Iconos */}
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', opacity: 0.6 }}>
            Iconos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, marginBottom: 20 }}>
            {PROGRESS_SVGS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => setCoverSvgKey(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 4, padding: '10px 4px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: coverSvgKey === key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: coverSvgKey === key ? 'var(--accent-muted)' : 'var(--surface)',
                  color: coverSvgKey === key ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 150ms',
                }}
              >
                <ProgressIcon svgKey={key} size={22} />
                <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.2 }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Grupo: Ilustraciones del puzzle */}
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', opacity: 0.6 }}>
            Ilustraciones
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8 }}>
            {PUZZLE_COVERS.map(({ key, url, label }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => setCoverSvgKey(key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 4, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: coverSvgKey === key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: coverSvgKey === key ? 'var(--accent-muted)' : 'var(--surface)',
                  transition: 'all 150ms',
                  aspectRatio: '1',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={url}
                  alt={label}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'calc(var(--radius-md) - 4px)', display: 'block' }}
                />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: '#ff6b6b', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="submit" disabled={loading} style={{ minWidth: 160 }}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <button
            type="button"
            onClick={() => navigate(`/proyectos/${projectId}`)}
            style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
