import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PhotoLightbox } from './PhotoLightbox.js'
import { Button } from '../ui/Button.js'
import type { ProfileResponse } from '../../types/index.js'

interface ProfileMediaTabProps {
  profile: ProfileResponse
  isOwner: boolean
  onItemClick: (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => void
}

export function ProfileMediaTab({ profile, isOwner, onItemClick }: ProfileMediaTabProps) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const photos = profile.photos ?? []

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p className="font-sans text-sm text-[var(--text-muted)] text-center">
          {isOwner ? 'Agrega fotos desde la edicion de perfil.' : 'Sin fotos publicadas.'}
        </p>
        {isOwner && (
          <Link to="/profile/edit">
            <Button variant="outline" size="sm">Agregar fotos</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2">
        {photos.map((photo, i) => (
          <div
            key={photo.url + i}
            className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-elevated)] cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              if (photo.id) {
                onItemClick({ kind: 'photo', id: photo.id }, rect)
              }
            }}
          >
            <img
              src={photo.url}
              alt={`Foto ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
