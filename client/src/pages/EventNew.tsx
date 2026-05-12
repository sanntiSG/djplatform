import { useNavigate } from 'react-router-dom'
import { useCreateEvent } from '../hooks/useEvents.js'
import { useMyProfile } from '../hooks/useProfile.js'
import { EventForm } from '../components/events/EventForm.js'
import { Button } from '../components/ui/Button.js'
import { Link } from 'react-router-dom'
import { eventPath } from '../utils/slug.js'
import type { CreateEventInput } from '../types/index.js'

export default function EventNew() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useMyProfile()
  const { mutateAsync } = useCreateEvent()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-[var(--text)] text-xl">
          Necesitas un perfil para publicar eventos
        </p>
        <p className="font-sans text-sm text-[var(--text-muted)] max-w-sm">
          Crea tu perfil primero y despues podes empezar a publicar eventos.
        </p>
        <Link to="/profile/setup">
          <Button variant="primary" size="md">Crear mi perfil</Button>
        </Link>
      </div>
    )
  }

  async function handleSubmit(data: CreateEventInput, _locationVerified: boolean) {
    const event = await mutateAsync(data)
    navigate(eventPath(event.slug, event.id))
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-24">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <h1
            className="font-display font-semibold text-[var(--text)]"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
          >
            Publicar evento
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-2">
            Aparecera en el feed de eventos de la plataforma y en tu perfil.
          </p>
        </div>

        <EventForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
