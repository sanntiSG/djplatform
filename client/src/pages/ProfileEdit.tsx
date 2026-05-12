import { useNavigate, useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
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
import { Toast } from '../components/ui/Toast.js'
import { profilePath } from '../utils/slug.js'
import { uploadImage } from '../services/uploadService.js'
import { moderationService } from '../services/moderationService.js'
import { AnalyzingIndicator } from '../components/ui/AnalyzingIndicator.js'
import { useProfileTypes } from '../hooks/useProfileTypes.js'
import { cn } from '../utils/cn.js'
import { prefersReducedMotion } from '../utils/motion.js'
import type { CreateProfileInput, MediaItem, Photo, ProfileTheme } from '../types/index.js'

const TABS = [
  { id: 'info', label: 'Informacion' },
  { id: 'media', label: 'Media' },
  { id: 'visual', label: 'Visual' },
  { id: 'musica', label: 'Musica' },
]

const BASE_TYPE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  other: 'Artista',
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: profile, isLoading } = useMyProfile()
  const { mutateAsync: update, isPending } = useUpdateProfile()
  const { data: profileTypes } = useProfileTypes()
  
  const [tab, setTab] = useState(() => {
    const hashTab = location.hash.replace('#', '')
    return TABS.some(t => t.id === hashTab) ? hashTab : 'info'
  })

  // Update tab if URL hash changes
  useEffect(() => {
    const hashTab = location.hash.replace('#', '')
    if (TABS.some(t => t.id === hashTab)) {
      setTab(hashTab)
    }
  }, [location.hash])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [localTheme, setLocalTheme] = useState<ProfileTheme>('minimal')
  const [localAccent, setLocalAccent] = useState('')
  const [localCover, setLocalCover] = useState<string | undefined>(undefined)
  const [localPhotos, setLocalPhotos] = useState<Photo[]>([])
  const [visualSaved, setVisualSaved] = useState(false)
  const [photosSaved, setPhotosSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)
  const [photoModerationError, setPhotoModerationError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<Photo | null>(null)
  const [typeToast, setTypeToast] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const typePillRefs = useRef<(HTMLButtonElement | null)[]>([])

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

  async function handleInfoSubmit(data: CreateProfileInput, locationVerified: boolean) {
    const updated = await update({ ...data, locationVerified })
    navigate(profilePath(updated.slug, updated.id))
  }

  async function handleAvatarUploaded(url: string) {
    await update({ avatar: url })
  }

  async function handleTypeChange(type: string, idx: number) {
    if (!profile || type === profile.type) return
    if (!prefersReducedMotion()) {
      const el = typePillRefs.current[idx]
      if (el) gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.44, ease: 'back.out(2.5)' })
    }
    await update({ type })
    setTypeToast(true)
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
    setPhotoModerationError('')
    setUploadingPhoto(true)
    let uploadedUrl: string | null = null
    try {
      uploadedUrl = await uploadImage(file, 'dj/profile-photos')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
    if (!uploadedUrl) return

    // Moderate before preview
    setAnalyzingPhoto(true)
    try {
      const modResult = await moderationService.analyzeImage(uploadedUrl)
      if (!modResult.approved) {
        await moderationService.deleteUploadedAsset(uploadedUrl).catch(() => undefined)
        setPhotoModerationError('Contenido inapropiado. La foto fue rechazada.')
        return
      }
    } catch {
      // If moderation unavailable, allow through
    } finally {
      setAnalyzingPhoto(false)
    }

    setPhotoPreview({ url: uploadedUrl, addedAt: new Date().toISOString(), caption: '' })
  }

  function handleConfirmPhoto() {
    if (!photoPreview) return
    setLocalPhotos((prev) => [...prev, photoPreview])
    setPhotoPreview(null)
  }

  function handleRemovePhoto(index: number) {
    setLocalPhotos((prev: Photo[]) => prev.filter((_, i) => i !== index))
  }

  function handleUpdatePhotoCaption(index: number, caption: string) {
    setLocalPhotos((prev: Photo[]) => prev.map((p, i) => (i === index ? { ...p, caption } : p)))
  }

  function handleAddMedia(item: MediaItem) {
    setMediaItems((prev) => [...prev, item])
  }

  function handleRemoveMedia(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleUpdateMedia(index: number, patch: Partial<Pick<MediaItem, 'title' | 'description' | 'genres'>>) {
    setMediaItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <>
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
              {BASE_TYPE_LABEL[profile.type] ?? profile.type}
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
            {/* Location migration banner */}
            {profile.location && !profile.locationVerified && (
              <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-sans text-sm font-medium text-[var(--accent)]">Actualizamos el sistema de ubicaciones</p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
                    Confirma tu ubicacion para mejorar tu visibilidad en buscadores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update({ location: profile.location, locationVerified: true })}
                  className="flex-shrink-0 font-sans text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  Confirmar
                </button>
              </div>
            )}
            {/* Type switcher — saves instantly */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
              <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Tipo de artista
              </p>
              <div className="flex gap-2 flex-wrap">
                {(profileTypes ?? Object.keys(BASE_TYPE_LABEL).map((slug) => ({ slug, name: BASE_TYPE_LABEL[slug] }))).map((t, idx) => (
                  <button
                    key={t.slug}
                    ref={(el) => { typePillRefs.current[idx] = el }}
                    type="button"
                    onClick={() => handleTypeChange(t.slug, idx)}
                    className={cn(
                      'rounded-full px-5 py-2 font-sans text-sm font-medium transition-all duration-200 select-none',
                      profile.type === t.slug
                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                        : 'bg-transparent border border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-3">
                Podes cambiar tu tipo de artista cuando quieras. Se guarda al instante.
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-muted)] font-sans mb-3">Foto de perfil</p>
              <AvatarUploader current={profile.avatar} onUploaded={handleAvatarUploaded} />
            </div>
            <ProfileForm
              initial={{
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

        {/* ─── MEDIA ─── */}
        {tab === 'media' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Media del perfil
              </p>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Agrega fotos para tu perfil. Max 30 · JPG, PNG o WebP · 5 MB c/u. Para musica y videos, usa la pestana Musica.
              </p>
            </div>

            {/* Photo Preview block */}
            {photoPreview && (
              <div className="flex flex-col gap-3 bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border)]">
                <img
                  src={photoPreview.url}
                  alt="Previsualización"
                  className="w-full rounded-lg object-contain bg-black/20"
                  style={{ maxHeight: 300 }}
                />
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="font-sans text-xs text-[var(--text-muted)] ml-1">Título o descripción (Opcional)</label>
                  <input
                    type="text"
                    value={photoPreview.caption || ''}
                    onChange={(e) => setPhotoPreview({ ...photoPreview, caption: e.target.value })}
                    placeholder="Ej: Noche increíble en..."
                    className="w-full bg-transparent border-b border-[var(--border)] px-1 py-1.5 text-base sm:text-sm font-sans text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPhotoPreview(null)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="button" variant="primary" size="sm" onClick={handleConfirmPhoto} className="flex-1">
                    Agregar a mis fotos
                  </Button>
                </div>
              </div>
            )}

            {/* Photo grid preview */}
            {localPhotos.length > 0 && !photoPreview && (
              <ProfilePhotoGrid
                photos={localPhotos}
                editable
                onRemove={handleRemovePhoto}
                onUpdateCaption={handleUpdatePhotoCaption}
              />
            )}

            {/* Add photo button */}
            {localPhotos.length < 30 && !photoPreview && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto || analyzingPhoto}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors duration-150 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <span className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>+ Agregar foto</span>
                )}
              </button>
            )}

            {analyzingPhoto && <AnalyzingIndicator visible />}

            {photoModerationError && (
              <Toast
                message={photoModerationError}
                onDismiss={() => setPhotoModerationError('')}
                variant="error"
                duration={5000}
              />
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAddPhoto}
              className="hidden"
            />

            {localPhotos.length > 0 && !photoPreview && (
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

        {/* ─── MUSICA ─── */}
        {tab === 'musica' && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Musica y videos embebidos
              </p>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Pega un link de YouTube, SoundCloud o Spotify. Lo embebemos automaticamente.
              </p>
            </div>
            <MediaInput onAdd={handleAddMedia} />
            <MediaList items={mediaItems} editable onRemove={handleRemoveMedia} onUpdate={handleUpdateMedia} />
            {mediaItems.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={isPending}
                onClick={handleSaveMedia}
              >
                Guardar cambios
              </Button>
            )}
          </div>
        )}
      </div>
    </div>

    {typeToast && (
      <Toast
        message="Tipo de artista actualizado"
        variant="success"
        onDismiss={() => setTypeToast(false)}
        duration={2500}
      />
    )}
    </>
  )
}
