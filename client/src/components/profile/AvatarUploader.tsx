import { useState, useRef } from 'react'
import { uploadImage } from '../../services/uploadService.js'
import { cn } from '../../utils/cn.js'

interface AvatarUploaderProps {
  current?: string
  onUploaded: (url: string) => void
}

export function AvatarUploader({ current, onUploaded }: AvatarUploaderProps) {
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
      const url = await uploadImage(file, 'dj/avatars')
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
        className={cn(
          'relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[var(--border)]',
          'hover:border-[var(--accent)] transition-colors duration-150',
          loading && 'opacity-60 cursor-not-allowed',
        )}
        disabled={loading}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center">
            <span className="text-2xl text-[var(--text-muted)]">+</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        JPG, PNG o WebP. Max 5MB.
      </p>

      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
    </div>
  )
}
