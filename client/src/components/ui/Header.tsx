import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import { Button } from './Button.js'
import { cn } from '../../utils/cn.js'

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [location.pathname])

  function handleLogout() {
    clearAuth()
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-semibold text-lg tracking-tight text-[var(--text)]">
          DJ<span className="text-[var(--accent)]">Platform</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/profiles">
            {({ isActive }) => (
              <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                DJs
              </Button>
            )}
          </NavLink>
          <NavLink to="/events">
            {({ isActive }) => (
              <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                Eventos
              </Button>
            )}
          </NavLink>
          <div className="w-px h-4 bg-[var(--border)] mx-2" />
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">Admin</Button>
                </Link>
              )}
              <Link to="/me">
                <Button variant="ghost" size="sm">Mi cuenta</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Ingresar</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="primary" size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/5 transition-colors"
          aria-label="Menu"
        >
          <span
            className={cn(
              'block w-5 h-px bg-[var(--text)] transition-transform duration-200 origin-center',
              open && 'translate-y-[7px] rotate-45',
            )}
          />
          <span
            className={cn(
              'block w-5 h-px bg-[var(--text)] transition-opacity duration-200',
              open && 'opacity-0',
            )}
          />
          <span
            className={cn(
              'block w-5 h-px bg-[var(--text)] transition-transform duration-200 origin-center',
              open && '-translate-y-[7px] -rotate-45',
            )}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 flex flex-col gap-1">
          <Link
            to="/profiles"
            className="py-3 font-sans text-sm text-[var(--text)] border-b border-[var(--border)]"
          >
            DJs
          </Link>
          <Link
            to="/events"
            className="py-3 font-sans text-sm text-[var(--text)] border-b border-[var(--border)]"
          >
            Eventos
          </Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="py-3 font-sans text-sm text-[var(--text)] border-b border-[var(--border)]"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/me"
                className="py-3 font-sans text-sm text-[var(--text)] border-b border-[var(--border)]"
              >
                Mi cuenta
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 text-left font-sans text-sm text-[var(--text-muted)]"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="py-3 font-sans text-sm text-[var(--text)] border-b border-[var(--border)]"
              >
                Ingresar
              </Link>
              <Link
                to="/auth/register"
                className="py-3 font-sans text-sm font-medium text-[var(--accent)]"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
