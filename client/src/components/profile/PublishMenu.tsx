import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../utils/motion.js'

interface PublishMenuProps {
  profileSlug?: string
  profileId?: string
}

export function PublishMenu({ profileSlug, profileId }: PublishMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const close = useCallback(() => setIsOpen(false), [])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return
      close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Open animation
  useEffect(() => {
    if (!isOpen || !menuRef.current || prefersReducedMotion()) return
    const items = menuRef.current.querySelectorAll('.menu-item')
    gsap.fromTo(
      menuRef.current,
      { opacity: 0, scale: 0.92, y: -6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power3.out' },
    )
    gsap.fromTo(
      items,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', stagger: 0.04, delay: 0.05 },
    )
  }, [isOpen])

  function nav(to: string) {
    close()
    navigate(to)
  }

  const rect = triggerRef.current?.getBoundingClientRect()

  const profileUrl = profileSlug && profileId ? `/p/${profileSlug}-${profileId}` : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Menu de publicacion"
        aria-expanded={isOpen}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90 select-none accent-glow"
        style={{ background: 'var(--accent)', color: 'var(--bg)', flexShrink: 0 }}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(45deg)' : 'none',
          }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {isOpen && rect && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[110] w-52 rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col"
          style={{
            top: rect.bottom + 10,
            left: Math.max(12, Math.min(rect.right - 208, window.innerWidth - 220)),
            background: 'rgba(17,17,20,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            transformOrigin: 'top right',
          }}
        >
          {/* Publicar section */}
          <p className="px-4 pt-3 pb-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Publicar
          </p>

          <MenuItem icon={musicIcon} label="Cancion o video" onClick={() => nav('/profile/edit#musica')} />
          <MenuItem icon={photoIcon} label="Foto" onClick={() => nav('/profile/edit#media')} />
          <MenuItem icon={calendarIcon} label="Evento" onClick={() => nav('/events/new')} />
          <MenuItem icon={briefcaseIcon} label="Oportunidad" onClick={() => nav('/oportunidades/nueva')} />

          <div className="h-px mx-3 my-1" style={{ background: 'var(--border)' }} />

          {/* Perfil section */}
          <MenuItem icon={editIcon} label="Editar perfil" onClick={() => nav('/profile/edit#info')} />
          {profileUrl && (
            <MenuItem
              icon={eyeIcon}
              label="Ver perfil publico"
              onClick={() => { close(); window.location.href = profileUrl }}
              className="pb-1"
            />
          )}
          <div className="h-1" />
        </div>,
        document.body,
      )}
    </>
  )
}

/* ── Menu item ────────────────────────────────────────────── */

function MenuItem({
  icon, label, onClick, className = '',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left font-sans text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 active:bg-white/10 transition-colors duration-150 ${className}`}
    >
      <span className="flex-shrink-0 text-[var(--accent)]">{icon}</span>
      {label}
    </button>
  )
}

/* ── SVG icons (inline, 16×16) ────────────────────────────── */

const musicIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

const photoIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const calendarIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const briefcaseIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
)

const editIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const eyeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
