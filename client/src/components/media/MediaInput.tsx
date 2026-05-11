import { useState } from 'react'
import { mediaService } from '../../services/mediaService.js'
import { moderationService } from '../../services/moderationService.js'
import { useCatalogs } from '../../hooks/useCatalogs.js'
import { Input } from '../ui/Input.js'
import { Button } from '../ui/Button.js'
import { MultiSelect } from '../ui/Select.js'
import { MediaEmbed } from './MediaEmbed.js'
import { AnalyzingIndicator } from '../ui/AnalyzingIndicator.js'
import { Toast } from '../ui/Toast.js'
import type { MediaItem } from '../../types/index.js'

interface MediaInputProps {
  onAdd: (item: MediaItem) => void
}

type Phase = 'idle' | 'resolving' | 'analyzing' | 'ready'

export function MediaInput({ onAdd }: MediaInputProps) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [moderationError, setModerationError] = useState('')
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const { genres } = useCatalogs()

  const genreOptions = (genres.data ?? []).map((g) => ({ value: g.name, label: g.name }))
  const loading = phase === 'resolving' || phase === 'analyzing'

  async function handleResolve() {
    if (!url.trim()) return
    setError('')
    setModerationError('')
    setPhase('resolving')
    setPreview(null)

    let resolved: MediaItem | null = null

    try {
      const result = await mediaService.resolve(url.trim())
      resolved = { ...result, description: '', genres: [] }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver el link')
      setPhase('idle')
      return
    }

    // Moderate before showing preview
    setPhase('analyzing')
    try {
      const modResult = await moderationService.analyzeMedia({ ...resolved, url: url.trim() })
      if (!modResult.approved) {
        setModerationError('Contenido inapropiado. Intenta otra URL.')
        setPhase('idle')
        return
      }
    } catch {
      // If moderation fails (network, config), allow through
    }

    setPreview(resolved)
    setPhase('ready')
  }

  function handleAdd() {
    if (!preview) return
    onAdd({ ...preview, addedAt: new Date().toISOString() })
    setUrl('')
    setPreview(null)
    setPhase('idle')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setPreview(null)
            setError('')
            setModerationError('')
            if (phase !== 'idle') setPhase('idle')
          }}
          placeholder="Pega un link de YouTube, SoundCloud o Spotify"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
        />
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleResolve}
          loading={loading}
          disabled={!url.trim() || loading}
        >
          Resolver
        </Button>
      </div>

      {phase === 'analyzing' && (
        <AnalyzingIndicator visible />
      )}

      {error && (
        <p className="text-xs text-red-400 font-sans">{error}</p>
      )}

      {moderationError && (
        <Toast
          message={moderationError}
          onDismiss={() => setModerationError('')}
          variant="error"
          duration={4000}
        />
      )}

      {preview && phase === 'ready' && (
        <div className="flex flex-col gap-3 bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border)]">
          <MediaEmbed item={preview} />

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="font-sans text-xs text-[var(--text-muted)] ml-1">Titulo</label>
            <Input
              value={preview.title || ''}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              placeholder="Ej: Mi ultimo set en vivo..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs text-[var(--text-muted)] ml-1">
              Descripcion <span className="text-[var(--text-muted)]/60">(opcional, max 1000 chars)</span>
            </label>
            <textarea
              value={preview.description || ''}
              onChange={(e) => setPreview({ ...preview, description: e.target.value })}
              placeholder="Describe este track, el contexto, el evento..."
              maxLength={1000}
              rows={2}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none transition-colors"
            />
          </div>

          <MultiSelect
            label="Generos (max 3)"
            options={genreOptions}
            value={preview.genres ?? []}
            onChange={(v) => setPreview({ ...preview, genres: v })}
            placeholder="Selecciona hasta 3 generos..."
            max={3}
          />

          <Button type="button" variant="primary" size="sm" onClick={handleAdd} className="mt-1">
            Agregar al perfil
          </Button>
        </div>
      )}
    </div>
  )
}
