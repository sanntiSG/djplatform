import { useNavigate } from 'react-router-dom'
import { useMyProfile, useUpdateProfile } from '../hooks/useProfile.js'
import { ProfileForm } from '../components/profile/ProfileForm.js'
import { AvatarUploader } from '../components/profile/AvatarUploader.js'
import { CoverUploader } from '../components/profile/CoverUploader.js'
import { ThemeSelector } from '../components/profile/ThemeSelector.js'
import { MediaInput } from '../components/media/MediaInput.js'
import { MediaList } from '../components/media/MediaList.js'
import { Button } from '../components/ui/Button.js'
import { Tabs } from '../components/ui/Tabs.js'
import { profilePath } from '../utils/slug.js'
import { useState, useEffect } from 'react'
import type { CreateProfileInput, MediaItem, ProfileTheme } from '../types/index.js'

const TABS = [
  { id: 'info', label: 'Informacion' },
  { id: 'visual', label: 'Visual' },
  { id: 'media', label: 'Musica y Videos' },
]

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useMyProfile()
  const { mutateAsync: update, isPending } = useUpdateProfile()
  const [tab, setTab] = useState('info')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [localTheme, setLocalTheme] = useState<ProfileTheme>('minimal')
  const [localAccent, setLocalAccent] = useState('')
  const [localCover, setLocalCover] = useState<string | undefined>(undefined)
  const [visualSaved, setVisualSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setMediaItems(profile.media ?? [])
      setLocalTheme((profile.theme as ProfileTheme) ?? 'minimal')
      setLocalAccent(profile.accentColor ?? '')
      setLocalCover(profile.coverImage)
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
    await update(data)
    navigate(profilePath(profile!.slug, profile!.id))
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

  function handleAddMedia(item: MediaItem) {
    setMediaItems((prev) => [...prev, item])
  }

  function handleRemoveMedia(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-24">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="font-display font-semibold text-[var(--text)]"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
            >
              Editar perfil
            </h1>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-1">{profile.artistName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(profilePath(profile.slug, profile.id))}
          >
            Ver perfil
          </Button>
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
