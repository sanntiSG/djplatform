import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { opportunityService } from '../services/opportunityService.js'
import { Button } from '../components/ui/Button.js'
import { Toggle } from '../components/ui/Toggle.js'
import { cn } from '../utils/cn.js'

const ROLE_OPTIONS = [
  { id: 'dj', label: 'DJ' },
  { id: 'producer', label: 'Productor' },
  { id: 'vocalist', label: 'Vocalista' },
  { id: 'designer', label: 'Disenador' },
  { id: 'organizer', label: 'Organizador' },
  { id: 'visuals', label: 'Visuales' },
]

export default function OpportunityNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [isRemote, setIsRemote] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleRole(id: string) {
    setLookingForRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El titulo es obligatorio'); return }
    if (lookingForRoles.length === 0) { setError('Selecciona al menos un rol'); return }
    setError('')
    setLoading(true)
    try {
      const opp = await opportunityService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        lookingForRoles,
        location: location.trim() || undefined,
        eventDate: eventDate || undefined,
        isPaid,
        isRemote,
      })
      navigate(`/oportunidades/${opp.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Error al publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] md:pt-16 px-5 sm:px-8 py-14">
      <div className="max-w-xl mx-auto">
        <h1
          className="font-display font-semibold text-[var(--text)] leading-none tracking-tighter mb-8"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
        >
          Nueva oportunidad
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Titulo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Busco DJ para evento privado en Buenos Aires"
              maxLength={100}
              required
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí el proyecto, fecha, estilo musical, presupuesto aproximado..."
              maxLength={2000}
              rows={5}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          {/* Roles */}
          <div className="flex flex-col gap-3">
            <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Busco
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 font-sans text-sm font-medium transition-all duration-200 select-none active:scale-95',
                    lookingForRoles.includes(r.id)
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Ubicacion
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Buenos Aires"
                maxLength={100}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Fecha (opcional)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-sm font-medium text-[var(--text)]">Trabajo pago</p>
                <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">Se muestra como oportunidad remunerada.</p>
              </div>
              <Toggle checked={isPaid} onChange={setIsPaid} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-sm font-medium text-[var(--text)]">Remoto</p>
                <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">La colaboracion puede hacerse a distancia.</p>
              </div>
              <Toggle checked={isRemote} onChange={setIsRemote} />
            </div>
          </div>

          {error && (
            <p className="font-sans text-sm text-[var(--c-red)] shake-error">{error}</p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading}>
            Publicar oportunidad
          </Button>
        </form>
      </div>
    </div>
  )
}
