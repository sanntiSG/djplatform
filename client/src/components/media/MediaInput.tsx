import { useState } from 'react'
import { mediaService } from '../../services/mediaService.js'
import { Input } from '../ui/Input.js'
import { Button } from '../ui/Button.js'
import { MediaEmbed } from './MediaEmbed.js'
import type { MediaItem } from '../../types/index.js'

interface MediaInputProps {
  onAdd: (item: MediaItem) => void
}

export function MediaInput({ onAdd }: MediaInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<MediaItem | null>(null)

  async function handleResolve() {
    if (!url.trim()) return
    setError('')
    setLoading(true)
    setPreview(null)
    try {
      const result = await mediaService.resolve(url.trim())
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver el link')
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    if (!preview) return
    onAdd({ ...preview, addedAt: new Date().toISOString() })
    setUrl('')
    setPreview(null)
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
          disabled={!url.trim()}
        >
          Resolver
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-400 font-sans">{error}</p>
      )}

      {preview && (
        <div className="flex flex-col gap-3 bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border)]">
          <MediaEmbed item={preview} />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="font-sans text-xs text-[var(--text-muted)] ml-1">Título o descripción</label>
            <Input 
              value={preview.title || ''}
              onChange={(e) => setPreview({ ...preview, title: e.target.value })}
              placeholder="Ej: Mi último set en vivo..."
            />
          </div>
          <Button type="button" variant="primary" size="sm" onClick={handleAdd} className="mt-1">
            Agregar al perfil
          </Button>
        </div>
      )}
    </div>
  )
}
