import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateProfile } from '../hooks/useProfile.js'
import { ProfileForm } from '../components/profile/ProfileForm.js'
import { profilePath } from '../utils/slug.js'
import { cn } from '../utils/cn.js'
import type { CreateProfileInput, ProfileType } from '../types/index.js'

const TYPE_OPTS: { value: ProfileType; label: string; desc: string }[] = [
  { value: 'dj', label: 'DJ', desc: 'Mezclas, sets en vivo, eventos' },
  { value: 'producer', label: 'Productor', desc: 'Produccion, beatmaking, studio' },
  { value: 'other', label: 'Artista', desc: 'Cantante, musico, locutora...' },
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateProfile()
  const [selectedType, setSelectedType] = useState<ProfileType>('dj')

  async function handleSubmit(data: CreateProfileInput) {
    const profile = await mutateAsync({ ...data, type: selectedType })
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
            {TYPE_OPTS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 border',
                  selectedType === t.value
                    ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text)]',
                )}
              >
                <span className="font-sans font-medium text-sm min-w-[80px]">{t.label}</span>
                <span className={cn('font-sans text-xs', selectedType === t.value ? 'text-[var(--bg)]/70' : 'text-[var(--text-muted)]')}>
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
