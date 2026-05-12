import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '../../utils/cn.js'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/profiles', label: 'Perfiles', end: false },
  { to: '/admin/events', label: 'Eventos', end: false },
  { to: '/admin/notifications', label: 'Notificaciones', end: false },
  { to: '/admin/users', label: 'Usuarios', end: false },
  { to: '/admin/genres', label: 'Generos', end: false },
  { to: '/admin/profile-types', label: 'Tipos de perfil', end: false },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-semibold text-[var(--text)] text-2xl">
              Admin
            </h1>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Panel de administracion
            </p>
          </div>
        </div>

        <nav className="flex gap-1 border-b border-[var(--border)] pb-0">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2.5 font-sans text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
                  isActive
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  )
}
