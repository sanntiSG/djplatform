import { useNavigate } from 'react-router-dom'
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile.js'
import { ProfileForm } from '../components/profile/ProfileForm.js'
import { AvatarUploader } from '../components/profile/AvatarUploader.js'
import { CoverUploader } from '../components/profile/CoverUploader.js'
import { ThemeSelector } from '../components/profile/ThemeSelector.js'
import { ProfilePhotoGrid } from '../components/profile/ProfilePhotoGrid.js'
import { MediaInput } from '../components/media/MediaInput.js'
import { MediaList } from '../components/media/MediaList.js'
import { Button } from '../components/ui/Button.js'
import { Tabs } from '../components/ui/Tabs.js'
import { profilePath } from '../utils/slug.js'
import { useState, useEffect, useRef } from 'react'
import { uploadImage } from '../services/uploadService.js'
import type { CreateProfileInput, MediaItem, ProfileTheme } from '../types/index.js'

const TABS = [
  { id: 'info', label: 'Informacion' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'visual', label: 'Visual' },
  { id: 'media', label: 'Musica y Videos' },
]

const TYPE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  other: 'Artista',
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useMyProfile()
  const { mutateAsync: update, isPending } = useUpdateProfile()
  const [tab, setTab] = useState('info')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [localTheme, setLocalTheme] = useState<ProfileTheme>('minimal')
  const [localAccent, setLocalAccent] = useState('')
  const [localCover, setLocalCover] = useState<string | undefined>(undefined)
  const [localPhotos, setLocalPhotos] = useState<string[]>([])
  const [visualSaved, setVisualSaved] = useState(false)
  const [photosSaved, setPhotosSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setMediaItems(profile.media ?? [])
      setLocalTheme((profile.theme as ProfileTheme) ?? 'minimal')
      setLocalAccent(profile.accentColor ?? '')
      setLocalCover(profile.coverImage)
      setLocalPhotos(profile.photos ?? [])
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    navigate('/profile/setup')
    return null
  }

  async function handleInfoSubmit(data: CreateProfileInput) {
    const updated = await update(data)
    navigate(profilePath(updated.slug, updated.id))
  }

  async function handleAvatarUploaded(url: string) {
    await update({ avatar: url })
  }

  async function handleCoverUploaded(url: string) {
    setLocalCover(url)
  }

  async function handleSaveVisual() {
    await update({
      coverImage: localCover,
      theme: localTheme,
      accentColor: localAccent || undefined,
    })
    setVisualSaved(true)
    setTimeout(() => setVisualSaved(false), 2000)
  }

  async function handleSaveMedia() {
    await update({ media: mediaItems })
  }

  async function handleSavePhotos() {
    await update({ photos: localPhotos })
    setPhotosSaved(true)
    setTimeout(() => setPhotosSaved(false), 2000)
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const url = await uploadImage(file, 'dj/profile-photos')
      setLocalPhotos((prev) => [...prev, url])
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  function handleRemovePhoto(index: number) {
    setLocalPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddMedia(item: MediaItem) {
    setMediaItems((prev) => [...prev, item])
  }

  function handleRemoveMedia(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-24">
      <div className="max-w-xl mx-auto">

        {/* Live profile preview strip */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] mb-6"
          style={{ background: 'var(--surface-elevated)' }}
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.artistName}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
              <span className="font-display font-semibold text-base text-[var(--text-muted)]">
                {profile.artistName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-[var(--text)] text-sm leading-tight truncate">
              {profile.artistName}
            </p>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {TYPE_LABEL[profile.type] ?? profile.type}
              {profile.location ? ` · ${profile.location}` : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(profilePath(profile.slug, profile.id))}
          >
            Ver perfil
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            Editar perfil
          </h1>
        </div>

        <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-8" />

        {/* ─── INFO ─── */}
        {tab === 'info' && (
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-sm text-[var(--text-muted)] font-sans mb-3">Foto de perfil</p>
              <AvatarUploader current={profile.avatar} onUploaded={handleAvatarUploaded} />
            </div>
            <ProfileForm
              initial={{
                type: profile.type,
                artistName: profile.artistName,
                bio: profile.bio,
                location: profile.location,
                genres: profile.genres,
                eventTypes: profile.eventTypes,
                availability: profile.availability,
                whatsapp: profile.whatsapp,
                priceRange: profile.priceRange,
              }}
              onSubmit={handleInfoSubmit}
              submitLabel="Guardar cambios"
            />
          </div>
        )}

        {/* ─── FOTOS ─── */}
        {tab === 'fotos' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Fotos del perfil
              </p>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Agrega fotos para decorar tu perfil. Max 30 fotos · JPG, PNG o WebP · Max 5 MB c/u
              </p>
            </div>

            {/* Photo grid preview */}
            {localPhotos.length > 0 && (
              <ProfilePhotoGrid
                photos={localPhotos}
                editable
                onRemove={handleRemovePhoto}
              />
            )}

            {/* Add photo button */}
            {localPhotos.length < 30 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors duration-150 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>+ Agregar foto</span>
                )}
              </button>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAddPhoto}
              className="hidden"
            />

            {localPhotos.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={isPending}
                onClick={handleSavePhotos}
              >
                {photosSaved ? 'Guardado' : 'Guardar fotos'}
              </Button>
            )}
          </div>
        )}

        {/* ─── VISUAL ─── */}
        {tab === 'visual' && (
          <div className="flex flex-col gap-8">
            <ThemeSelector value={localTheme} onChange={setLocalTheme} />

            <div className="flex flex-col gap-3">
              <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Imagen de portada
              </span>
              <CoverUploader current={localCover} onUploaded={handleCoverUploaded} />
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Color de acento personalizado
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localAccent || '#d4ff00'}
                  onChange={(e) => setLocalAccent(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={localAccent}
                  onChange={(e) => setLocalAccent(e.target.value)}
                  placeholder="#d4ff00"
                  maxLength={7}
                  className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-2 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
                />
                {localAccent && (
                  <button
                    type="button"
                    onClick={() => setLocalAccent('')}
                    className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Opcional. Sobreescribe el color de acento del tema.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              loading={isPending}
              onClick={handleSaveVisual}
            >
              {visualSaved ? 'Guardado' : 'Guardar visual'}
            </Button>
          </div>
        )}

        {/* ─── MEDIA ─── */}
        {tab === 'media' && (
          <div className="flex flex-col gap-6">
            <MediaInput onAdd={handleAddMedia} />
            <MediaList items={mediaItems} editable onRemove={handleRemoveMedia} />
            {mediaItems.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={isPending}
                onClick={handleSaveMedia}
              >
                Guardar cambios de media
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
