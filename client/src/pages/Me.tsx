import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore.js'
import { useMyProfile } from '../hooks/useProfile.js'
import { Button } from '../components/ui/Button.js'
import { Card } from '../components/ui/Card.js'
import { Pill } from '../components/ui/Pill.js'
import { profilePath } from '../utils/slug.js'
import type { Availability } from '../types/index.js'

const availabilityLabel: Record<Availability, string> = {
  available: 'Disponible',
  contact: 'Consultar',
  unavailable: 'No disponible',
}

const availabilityVariant: Record<Availability, 'available' | 'contact' | 'unavailable'> = {
  available: 'available',
  contact: 'contact',
  unavailable: 'unavailable',
}

export default function Me() {
  const { user, clearAuth } = useAuthStore()
  const { data: profile, isLoading } = useMyProfile()
  const navigate = useNavigate()

  function handleLogout() {
    clearAuth()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-24">
      <div className="max-w-sm mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.75rem' }}>
            Mi cuenta
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-1">Sesion activa</p>
        </div>

        <Card elevated className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">Email</span>
            <span className="font-sans text-sm text-[var(--text)]">{user.email}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">Rol</span>
            <span className="font-sans text-sm text-[var(--text)] capitalize">{user.role}</span>
          </div>
          {user.mustChangePassword && (
            <Link to="/auth/change-password">
              <div className="px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors">
                <p className="text-xs font-sans text-yellow-400">
                  Por seguridad, cambia tu contrasena. Toca para hacerlo ahora.
                </p>
              </div>
            </Link>
          )}
        </Card>

        {/* Panel de perfil */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <Card elevated className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.artistName} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[var(--surface)] flex items-center justify-center">
                  <span className="font-display text-lg text-[var(--text-muted)]">
                    {profile.artistName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-display font-semibold text-[var(--text)] text-base">{profile.artistName}</p>
                <Pill
                  label={availabilityLabel[profile.availability]}
                  variant={availabilityVariant[profile.availability]}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to={profilePath(profile.slug, profile.id)}>
                <Button variant="outline" size="sm">Ver perfil publico</Button>
              </Link>
              <Link to="/profile/edit">
                <Button variant="ghost" size="sm">Editar perfil</Button>
              </Link>
              <Link to="/events/new">
                <Button variant="ghost" size="sm">Publicar evento</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card elevated className="p-6 flex flex-col gap-4">
            <div>
              <p className="font-sans text-sm text-[var(--text)] font-medium">No tenes perfil todavia</p>
              <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
                Crea tu perfil para ofrecer servicios y publicar eventos.
              </p>
            </div>
            <Link to="/profile/setup">
              <Button variant="primary" size="sm">Crear mi perfil</Button>
            </Link>
          </Card>
        )}

        <Button variant="outline" size="md" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}
