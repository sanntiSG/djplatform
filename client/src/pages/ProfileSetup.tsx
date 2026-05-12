import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateProfile } from '../hooks/useProfile.js'
import { useProfileTypes } from '../hooks/useProfileTypes.js'
import { ProfileForm } from '../components/profile/ProfileForm.js'
import { profilePath } from '../utils/slug.js'
import { cn } from '../utils/cn.js'
import type { CreateProfileInput } from '../types/index.js'

const FALLBACK_TYPES = [
  { slug: 'dj', name: 'DJ', desc: 'Mezclas, sets en vivo, eventos' },
  { slug: 'producer', name: 'Productor', desc: 'Produccion, beatmaking, studio' },
  { slug: 'other', name: 'Artista', desc: 'Cantante, musico, locutora...' },
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateProfile()
  const { data: profileTypes } = useProfileTypes()
  const [selectedType, setSelectedType] = useState<string>('dj')

  async function handleSubmit(data: CreateProfileInput, locationVerified: boolean) {
    const profile = await mutateAsync({ ...data, type: selectedType, locationVerified })
    navigate(profilePath(profile.slug, profile.id))
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-24">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
          >
            Crea tu perfil
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-2">
            Tu espacio en la plataforma. Podes editarlo cuando quieras.
          </p>
        </div>

        {/* Artist type selection */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 mb-8">
          <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Tipo de artista
          </p>
          <div className="flex flex-col gap-2">
            {(profileTypes?.map((t) => ({ slug: t.slug, name: t.name, desc: '' })) ?? FALLBACK_TYPES).map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setSelectedType(t.slug)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 border',
                  selectedType === t.slug
                    ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                )}
              >
                <span className="font-sans font-medium text-sm min-w-[80px]">{t.name}</span>
                <span className={cn('font-sans text-xs', selectedType === t.slug ? 'text-[var(--bg)]/70' : 'text-[var(--text-muted)]')}>
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ProfileForm onSubmit={handleSubmit} submitLabel="Crear perfil" />
      </div>
    </div>
  )
}
