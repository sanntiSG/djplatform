/**
 * ProjectNew — form para crear un proyecto nuevo.
 * Campos: título, descripción, roles buscados, géneros, ubicación, fase inicial.
 * Patron visual idéntico a OpportunityNew con los chips de rol.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.js'
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete.js'
import { ProjectPhaseBar } from '../components/projects/ProjectPhaseBar.js'
import { useCreateProject } from '../hooks/useProjects.js'
import { PROJECT_PHASES, PROJECT_PHASE_LABELS, ROLE_OPTIONS } from '@dj/shared'
import type { ProjectPhase } from '../types/index.js'
import { cn } from '../utils/cn.js'

const GENRE_OPTIONS = [
  'Techno', 'House', 'Deep House', 'Indie Rock', 'Jazz', 'Hip Hop', 'R&B',
  'Cumbia', 'Reggaeton', 'Drum & Bass', 'Ambient', 'Trance', 'Pop', 'Folk', 'Metal',
]

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
    boxSizing: 'border-box',
  }
}

export default function ProjectNew() {
  const navigate = useNavigate()
  const { mutateAsync: createProject } = useCreateProject()

  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([])
  const [genres, setGenres]         = useState<string[]>([])
  const [location, setLocation]     = useState('')
  const [phase, setPhase]           = useState<ProjectPhase>('idea')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const [titleFocused, setTitleFocused] = useState(false)
  const [descFocused, setDescFocused]   = useState(false)

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
      const project = await createProject({
        title:           title.trim(),
        description:     description.trim() || undefined,
        lookingForRoles,
        genres,
        location:        location.trim() || undefined,
        phase,
      })
      navigate(`/proyectos/${project.id}`)
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el proyecto')
    } finally {
      setLoading(false)
    }
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
        onClick={() => navigate(-1)}
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
        Volver
      </button>

      <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Nuevo proyecto
      </h1>
      <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 32px' }}>
        Crea un espacio para construir algo junto a otros artistas.
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
            placeholder="Dale un nombre que lo identifique"
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
            placeholder="Contá de que se trata, que tipo de colaboracion buscas, a quien esta dirigido..."
            maxLength={2000}
            rows={4}
            style={{ ...inputStyle(descFocused), resize: 'vertical', minHeight: 96 }}
          />
        </div>

        {/* Fase inicial */}
        <div>
          <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Fase actual del proyecto
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROJECT_PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPhase(p)}
                style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontSize: 13,
                  fontWeight: phase === p ? 700 : 500,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-xl)',
                  border: phase === p ? 'none' : '1px solid var(--border)',
                  background: phase === p ? 'var(--accent)' : 'transparent',
                  color: phase === p ? 'var(--bg)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background 150ms, color 150ms',
                }}
              >
                {PROJECT_PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Roles que busca */}
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
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xl)',
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms',
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
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xl)',
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--accent-muted)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms',
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

        {error && (
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: '#ff6b6b', margin: 0 }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', minWidth: 160 }}>
          {loading ? 'Creando...' : 'Crear proyecto'}
        </Button>
      </form>
    </div>
  )
}
