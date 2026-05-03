import { useState } from 'react'
import { Input } from '../ui/Input.js'
import { Button } from '../ui/Button.js'
import { CoverUploader } from './CoverUploader.js'
import type { CreateEventInput } from '../../types/index.js'

interface EventFormProps {
  initial?: Partial<CreateEventInput>
  onSubmit: (data: CreateEventInput) => Promise<void>
  submitLabel?: string
}

export function EventForm({ initial = {}, onSubmit, submitLabel = 'Publicar evento' }: EventFormProps) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    description: initial.description ?? '',
    date: initial.date ? initial.date.slice(0, 16) : '',
    location: initial.location ?? '',
    cover: initial.cover ?? '',
    media: initial.media ?? [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const dateISO = new Date(form.date).toISOString()
      await onSubmit({
        title: form.title,
        description: form.description || undefined,
        date: dateISO,
        location: form.location || undefined,
        cover: form.cover || undefined,
        media: form.media,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[var(--text-muted)] font-sans">Portada del evento</label>
        <CoverUploader current={form.cover} onUploaded={(url) => set('cover', url)} />
      </div>

      <Input
        label="Titulo"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="Nombre del evento"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[var(--text-muted)] font-sans">Descripcion</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Contale a la gente de que se trata..."
          maxLength={2000}
          rows={4}
          className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md px-4 py-3 text-[var(--text)] text-sm font-sans placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
        />
      </div>

      <Input
        label="Fecha y hora"
        type="datetime-local"
        value={form.date}
        onChange={(e) => set('date', e.target.value)}
        required
      />

      <Input
        label="Lugar"
        value={form.location}
        onChange={(e) => set('location', e.target.value)}
        placeholder="Nombre del venue o direccion"
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
