import { useState } from 'react'

interface ProfilePhotoGridProps {
  photos: string[]
  editable?: boolean
  onRemove?: (index: number) => void
}

export function ProfilePhotoGrid({ photos, editable, onRemove }: ProfilePhotoGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div
            key={url + i}
            className="relative group aspect-square overflow-hidden rounded-xl bg-[var(--surface-elevated)] cursor-pointer"
            onClick={() => !editable && setLightbox(url)}
          >
            <img
              src={url}
              alt={`Foto ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {editable && onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Eliminar foto"
              >
                <span className="text-white text-xs leading-none">x</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-[92vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white font-sans text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  )
}
