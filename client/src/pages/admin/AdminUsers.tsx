import { Link } from 'react-router-dom'
import { useAdminUsers } from '../../hooks/useAdmin.js'
import { Pill } from '../../components/ui/Pill.js'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <span className="font-sans text-xs text-[var(--text-muted)]">
          {users?.length ?? 0} usuarios
        </span>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !users?.length ? (
          <p className="text-center font-sans text-sm text-[var(--text-muted)] py-16">
            No hay usuarios
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans text-sm text-[var(--text)] truncate">{user.email}</span>
                  {user.role === 'admin' && <Pill label="ADMIN" variant="accent" />}
                </div>
                <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
                  Registrado {formatDate(user.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {user.profileId ? (
                  <Link
                    to={`/p/${user.profileId}`}
                    target="_blank"
                    className="font-sans text-xs text-[var(--accent)] hover:underline"
                  >
                    Ver perfil
                  </Link>
                ) : (
                  <span className="font-sans text-xs text-[var(--text-muted)]">Sin perfil</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
