import { useState } from 'react'
import type { Photo } from '../../types/index.js'

interface ProfilePhotoGridProps {
  photos: Photo[]
  editable?: boolean
  onRemove?: (index: number) => void
  onUpdateCaption?: (index: number, caption: string) => void
}

export function ProfilePhotoGrid({ photos, editable, onRemove, onUpdateCaption }: ProfilePhotoGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div
            key={photo.url + i}
            className="relative group aspect-square overflow-hidden rounded-xl bg-[var(--surface-elevated)] cursor-pointer"
            onClick={() => !editable && setLightbox(photo.url)}
          >
            <img
              src={photo.url}
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
            {editable ? (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 transition-opacity duration-150">
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => onUpdateCaption?.(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Agregar descripción..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
            ) : (
              photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 pointer-events-none">
                  <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
                </div>
              )
            )}
          </div>
        ))}
      </div>

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
