import { useNavigate } from 'react-router-dom'
import { useCreateProfile } from '../hooks/useProfile.js'
import { ProfileForm } from '../components/profile/ProfileForm.js'
import { profilePath } from '../utils/slug.js'
import type { CreateProfileInput } from '../types/index.js'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateProfile()

  async function handleSubmit(data: CreateProfileInput) {
    const profile = await mutateAsync(data)
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

        <ProfileForm onSubmit={handleSubmit} submitLabel="Crear perfil" />
      </div>
    </div>
  )
}
