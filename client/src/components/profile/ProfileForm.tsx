import { useState } from 'react'
import { Input } from '../ui/Input.js'
import { Button } from '../ui/Button.js'
import { MultiSelect } from '../ui/Select.js'
import { useCatalogs } from '../../hooks/useCatalogs.js'
import type { CreateProfileInput, ProfileType, Availability } from '../../types/index.js'

interface ProfileFormProps {
  initial?: Partial<CreateProfileInput>
  onSubmit: (data: CreateProfileInput) => Promise<void>
  submitLabel?: string
}

const profileTypes: { value: ProfileType; label: string }[] = [
  { value: 'dj', label: 'DJ' },
  { value: 'producer', label: 'Productor' },
  { value: 'other', label: 'Otro' },
]

const availabilities: { value: Availability; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'contact', label: 'Consultar para coordinar' },
  { value: 'unavailable', label: 'No disponible' },
]

export function ProfileForm({ initial = {}, onSubmit, submitLabel = 'Guardar' }: ProfileFormProps) {
  const { genres, eventTypes } = useCatalogs()
  const [form, setForm] = useState<CreateProfileInput>({
    type: initial.type ?? 'dj',
    artistName: initial.artistName ?? '',
    bio: initial.bio ?? '',
    location: initial.location ?? '',
    genres: initial.genres ?? [],
    eventTypes: initial.eventTypes ?? [],
    availability: initial.availability ?? 'contact',
    whatsapp: initial.whatsapp ?? '',
    priceRange: initial.priceRange ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set<K extends keyof CreateProfileInput>(key: K, value: CreateProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const genreOptions = (genres.data ?? []).map((g) => ({ value: g.name, label: g.name }))
  const eventTypeOptions = (eventTypes.data ?? []).map((t) => ({ value: t.name, label: t.name }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Tipo de perfil */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[var(--text-muted)] font-sans">Tipo de perfil</label>
        <div className="flex gap-2 flex-wrap">
          {profileTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('type', t.value)}
              className={`px-4 py-2 rounded-md text-sm font-sans border transition-colors duration-150 ${
                form.type === t.value
                  ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Nombre artistico"
        value={form.artistName}
        onChange={(e) => set('artistName', e.target.value)}
        placeholder="Tu nombre o alias"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[var(--text-muted)] font-sans">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="Contate un poco..."
          maxLength={1000}
          rows={4}
          className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md px-4 py-3 text-[var(--text)] text-base font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none transition-all duration-150"
        />
        <p className="text-xs text-[var(--text-muted)] font-sans text-right">{(form.bio ?? '').length}/1000</p>
      </div>

      <Input
        label="Ubicacion"
        value={form.location ?? ''}
        onChange={(e) => set('location', e.target.value)}
        placeholder="Ej: CABA, Rosario, Cordoba..."
      />

      <MultiSelect
        label="Generos musicales"
        options={genreOptions}
        value={form.genres}
        onChange={(v) => set('genres', v)}
        placeholder="Selecciona tus generos"
        max={10}
      />

      <MultiSelect
        label="Tipos de evento"
        options={eventTypeOptions}
        value={form.eventTypes}
        onChange={(v) => set('eventTypes', v)}
        placeholder="Que tipo de eventos haces"
        max={10}
      />

      {/* Disponibilidad */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[var(--text-muted)] font-sans">Disponibilidad</label>
        <div className="flex gap-2 flex-wrap">
          {availabilities.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => set('availability', a.value)}
              className={`px-4 py-2 rounded-md text-sm font-sans border transition-colors duration-150 ${
                form.availability === a.value
                  ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                  : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-white/20'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="WhatsApp (para contacto)"
        type="tel"
        value={form.whatsapp ?? ''}
        onChange={(e) => set('whatsapp', e.target.value)}
        placeholder="+54 9 11 1234-5678"
      />

      {error && (
        <div className="px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}
