import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import { useConversationUnread } from '../../hooks/useConversations.js'
import { useTransition } from '../transition/TransitionProvider.js'
import { Button } from './Button.js'
import { MobileNavSheet } from './MobileNavSheet.js'
import { cn } from '../../utils/cn.js'

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="unread-badge inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold px-1 leading-none ml-1.5">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Header() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { data: unread } = useConversationUnread()
  const unreadCount = unread?.total ?? 0
  const { arm } = useTransition()

  function handleLogout() {
    arm()
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
            <NavLink to="/feed" onClick={() => arm()}>
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                  Inicio
                </Button>
              )}
            </NavLink>
            <NavLink to="/profiles" onClick={() => arm()}>
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                  Artistas
                </Button>
              )}
            </NavLink>
            <NavLink to="/events" onClick={() => arm()}>
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                  Eventos
                </Button>
              )}
            </NavLink>
            <NavLink to="/oportunidades" onClick={() => arm()}>
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={isActive ? 'text-[var(--accent)]' : ''}>
                  Oportunidades
                </Button>
              )}
            </NavLink>
            <div className="w-px h-4 bg-[var(--border)] mx-2" />
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => arm()}>
                    <Button variant="ghost" size="sm">Admin</Button>
                  </Link>
                )}
                <Link to="/me/mensajes" onClick={() => arm()}>
                  <Button variant="ghost" size="sm" className="relative">
                    Mensajes
                    <UnreadBadge count={unreadCount} />
                  </Button>
                </Link>
                <Link to="/me" onClick={() => arm()}>
                  <Button variant="ghost" size="sm">Mi cuenta</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => arm()}>
                  <Button variant="ghost" size="sm">Ingresar</Button>
                </Link>
                <Link to="/auth/register" onClick={() => arm()}>
                  <Button variant="primary" size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile floating wordmark pill — top-left, hidden on md+ */}
      <Link
        to="/"
        onClick={() => arm()}
        className={cn(
          'fixed z-[90] glass-pill rounded-full md:hidden h-11 px-4',
          'flex items-center justify-center font-display font-semibold tracking-tight',
          'text-[var(--text)] active:scale-95 transition-transform duration-100 select-none',
        )}
        style={{
          top: 'max(env(safe-area-inset-top), 12px)',
          left: 'max(env(safe-area-inset-left), 16px)',
          fontSize: 15,
        }}
        aria-label="Inicio"
      >
        RE<span className="text-[var(--accent)]">sonar</span>
      </Link>

      {/* Mobile floating hamburger pill — hidden on md+ */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed z-[90] glass-pill rounded-full w-11 h-11',
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
        {/* Unread indicator dot on hamburger */}
        {unreadCount > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)]" style={{ boxShadow: '0 0 6px rgba(212,255,0,0.5)' }} />
        )}
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
