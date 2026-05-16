import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore.js'
import { useMyProfile } from '../hooks/useProfile.js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profilePath } from '../utils/slug.js'
import { Button } from '../components/ui/Button.js'
import { Card } from '../components/ui/Card.js'
import { Pill } from '../components/ui/Pill.js'
import { notificationsService } from '../services/notificationsService.js'
import { conversationsService } from '../services/conversationsService.js'
import { collaborationsService } from '../services/collaborationsService.js'
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
  const { data: inboxData } = useQuery({
    queryKey: ['notification-inbox'],
    queryFn: () => notificationsService.getInbox({ limit: 1 }),
    enabled: !!user,
    staleTime: 15_000,
  })
  const { data: convUnread } = useQuery({
    queryKey: ['conversations-unread'],
    queryFn: () => conversationsService.getUnreadTotal(),
    enabled: !!user,
    staleTime: 15_000,
  })

  const queryClient = useQueryClient()
  const { data: pendingCollabs } = useQuery({
    queryKey: ['collaborations', 'pending'],
    queryFn: () => collaborationsService.listPending(),
    enabled: !!profile,
    staleTime: 60_000,
  })

  const confirmCollab = useMutation({
    mutationFn: (id: string) => collaborationsService.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collaborations'] }),
  })
  const rejectCollab = useMutation({
    mutationFn: (id: string) => collaborationsService.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collaborations'] }),
  })

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

        {/* Mensajes */}
        <Link to="/me/mensajes" className="block">
          <Card elevated className="p-5 flex items-center justify-between gap-3 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] flex items-center justify-center">
                <MessageSmIcon />
              </div>
              <span className="font-sans text-sm font-medium text-[var(--text)]">Mensajes</span>
            </div>
            <div className="flex items-center gap-2">
              {(convUnread?.total ?? 0) > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-[var(--accent)] text-[var(--bg)] text-[11px] font-bold px-1.5 flex items-center justify-center">
                  {convUnread!.total > 99 ? '99+' : convUnread!.total}
                </span>
              )}
              <ChevronIcon />
            </div>
          </Card>
        </Link>

        {/* Colaboraciones pendientes */}
        {pendingCollabs && pendingCollabs.length > 0 && (
          <Card elevated className="p-5 flex flex-col gap-3">
            <p className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
              Colaboraciones pendientes
            </p>
            {pendingCollabs.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 pb-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  {c.fromAvatar ? (
                    <img src={c.fromAvatar} alt={c.fromArtistName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
                      <span className="font-display text-xs text-[var(--text-muted)]">{c.fromArtistName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-[var(--text-muted)] mb-0.5">
                    <span className="font-medium text-[var(--text)]">{c.fromArtistName}</span> propuso:
                  </p>
                  <p className="font-sans text-sm font-medium text-[var(--text)] mb-2">{c.title}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={confirmCollab.isPending}
                      onClick={() => confirmCollab.mutate(c.id)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={rejectCollab.isPending}
                      onClick={() => rejectCollab.mutate(c.id)}
                      className="text-[var(--text-muted)]"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Notificaciones */}
        <Link to="/me/notificaciones" className="block">
          <Card elevated className="p-5 flex items-center justify-between gap-3 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] flex items-center justify-center">
                <BellSmIcon />
              </div>
              <span className="font-sans text-sm font-medium text-[var(--text)]">Notificaciones</span>
            </div>
            <div className="flex items-center gap-2">
              {(inboxData?.unreadCount ?? 0) > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-[var(--accent)] text-[var(--bg)] text-[11px] font-bold px-1.5 flex items-center justify-center">
                  {inboxData!.unreadCount > 99 ? '99+' : inboxData!.unreadCount}
                </span>
              )}
              <ChevronIcon />
            </div>
          </Card>
        </Link>

        <Button variant="outline" size="md" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}

function MessageSmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BellSmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
