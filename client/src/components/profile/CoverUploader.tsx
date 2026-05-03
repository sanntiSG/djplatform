import { useState, useRef } from 'react'
import { uploadImage } from '../../services/uploadService.js'
import { cn } from '../../utils/cn.js'

interface CoverUploaderProps {
  current?: string
  onUploaded: (url: string) => void
}

export function CoverUploader({ current, onUploaded }: CoverUploaderProps) {
  const [preview, setPreview] = useState<string | null>(current ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const url = await uploadImage(file, 'dj/profile-covers')
      onUploaded(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
      setPreview(current ?? null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={cn(
          'relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-[var(--border)]',
          'hover:border-[var(--accent)] transition-colors duration-150',
          loading && 'opacity-60 cursor-not-allowed',
        )}
      >
        {preview ? (
          <img src={preview} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--surface-elevated)] flex flex-col items-center justify-center gap-2">
            <span className="text-2xl text-[var(--text-muted)]">+</span>
            <span className="font-sans text-xs text-[var(--text-muted)]">Subir imagen de portada</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      <p className="text-xs text-[var(--text-muted)] font-sans">
        Formato 16:9 recomendado. JPG, PNG o WebP.
      </p>
      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
    </div>
  )
}
