import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useAuthStore } from '../../store/useAuthStore.js'
import { useConversationUnread } from '../../hooks/useConversations.js'
import { useTransition } from '../transition/TransitionProvider.js'
import { cn } from '../../utils/cn.js'

interface Props {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

const NAV_LINKS = [
  { to: '/feed', label: 'Inicio' },
  { to: '/profiles', label: 'Artistas' },
  { to: '/events', label: 'Eventos' },
  { to: '/oportunidades', label: 'Oportunidades' },
]

export function MobileNavSheet({ open, onClose, onLogout }: Props) {
  const { user } = useAuthStore()
  const location = useLocation()
  const { arm } = useTransition()
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const didInit = useRef(false)

  const { data: unread } = useConversationUnread()
  const unreadCount = unread?.total ?? 0

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Body scroll lock — iOS-safe: position:fixed preserves viewport-fit=cover
  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  // Sheet animation
  useEffect(() => {
    const sheet = sheetRef.current
    const backdrop = backdropRef.current
    if (!sheet || !backdrop) return

    if (!didInit.current) {
      gsap.set(sheet, { y: '100%' })
      gsap.set(backdrop, { opacity: 0, pointerEvents: 'none' })
      didInit.current = true
    }

    if (tlRef.current) tlRef.current.kill()
    const tl = gsap.timeline()
    tlRef.current = tl

    if (open) {
      const items = navRef.current ? navRef.current.querySelectorAll('a, button') : []
      gsap.set(backdrop, { pointerEvents: 'auto' })
      tl
        .to(backdrop, { opacity: 1, duration: 0.22, ease: 'power2.out' })
        .to(sheet, { y: 0, duration: 0.46, ease: 'expo.out' }, '<0.04')
        .fromTo(
          items,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.045, duration: 0.3, ease: 'power3.out', clearProps: 'transform,opacity' },
          '-=0.22',
        )
    } else {
      gsap.set(backdrop, { pointerEvents: 'none' })
      tl
        .to(sheet, { y: '100%', duration: 0.32, ease: 'expo.in' })
        .to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '<0.06')
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/55"
        style={{ backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-[81] glass-pill rounded-t-[30px] flex flex-col overflow-hidden"
        style={{
          boxShadow: '0 -16px 64px rgba(0,0,0,0.75)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-9 h-[3px] rounded-full bg-white/15" />
        </div>

        {/* Links */}
        <nav ref={navRef} className="flex flex-col px-7 pt-2 pb-2">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => { arm(); onClose() }}
              className="font-display font-semibold text-[var(--text)] flex items-center justify-between border-b border-[var(--border)] group"
              style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
            >
              {label}
              <span
                className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1"
                style={{ fontSize: '1.1rem' }}
              >
                ›
              </span>
            </Link>
          ))}

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => { arm(); onClose() }}
                  className="font-display font-semibold text-[var(--text)] flex items-center justify-between border-b border-[var(--border)] group"
                  style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
                >
                  Admin
                  <span className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '1.1rem' }}>›</span>
                </Link>
              )}
              <Link
                to="/me/mensajes"
                onClick={() => { arm(); onClose() }}
                className="font-display font-semibold text-[var(--text)] flex items-center justify-between border-b border-[var(--border)] group"
                style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
              >
                <span className="flex items-center gap-3">
                  Mensajes
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-[var(--accent)] text-[var(--bg)] text-[11px] font-bold px-1.5 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '1.1rem' }}>›</span>
              </Link>
              <Link
                to="/me"
                onClick={() => { arm(); onClose() }}
                className="font-display font-semibold text-[var(--text)] flex items-center justify-between border-b border-[var(--border)] group"
                style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
              >
                Mi cuenta
                <span className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '1.1rem' }}>›</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className={cn(
                  'font-display font-medium text-left text-[var(--text-muted)] flex items-center w-full',
                  'transition-colors duration-150 hover:text-[var(--text)]',
                )}
                style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', paddingBlock: '1.05rem' }}
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                onClick={() => { arm(); onClose() }}
                className="font-display font-semibold text-[var(--text)] flex items-center justify-between border-b border-[var(--border)] group"
                style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
              >
                Ingresar
                <span className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '1.1rem' }}>›</span>
              </Link>
              <Link
                to="/auth/register"
                onClick={() => { arm(); onClose() }}
                className="font-display font-semibold text-[var(--accent)] flex items-center justify-between group"
                style={{ fontSize: 'clamp(1.6rem, 5.5vw, 2.1rem)', paddingBlock: '1.05rem' }}
              >
                Registrarse
                <span className="text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '1.1rem' }}>›</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
