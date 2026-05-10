import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import { Button } from './Button.js'
import { MobileNavSheet } from './MobileNavSheet.js'
import { cn } from '../../utils/cn.js'

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    clearAuth()
    navigate('/')
    setOpen(false)
  }

  return (
    <>
      {/* Desktop header — visible only on md+ */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)] hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold text-lg tracking-tight text-[var(--text)]">
            RE<span className="text-[var(--accent)]">sonar</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/feed">
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                  Inicio
                </Button>
              )}
            </NavLink>
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
        </div>
      </header>

      {/* Mobile floating hamburger pill — hidden on md+ */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed z-[51] glass-pill rounded-full w-11 h-11',
          'flex flex-col items-center justify-center gap-[5px]',
          'md:hidden',
          'transition-transform duration-100 active:scale-90',
        )}
        style={{
          top: 'max(env(safe-area-inset-top), 12px)',
          right: 'max(env(safe-area-inset-right), 16px)',
        }}
        aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
      >
        <span
          className={cn(
            'block w-[15px] h-px bg-[var(--text)] transition-transform duration-200 origin-center',
            open && 'translate-y-[6px] rotate-45',
          )}
        />
        <span
          className={cn(
            'block w-[15px] h-px bg-[var(--text)] transition-all duration-200',
            open && 'opacity-0 scale-x-0',
          )}
        />
        <span
          className={cn(
            'block w-[15px] h-px bg-[var(--text)] transition-transform duration-200 origin-center',
            open && '-translate-y-[6px] -rotate-45',
          )}
        />
      </button>

      {/* Mobile navigation bottom sheet */}
      <MobileNavSheet open={open} onClose={() => setOpen(false)} onLogout={handleLogout} />
    </>
  )
}
