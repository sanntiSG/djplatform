import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

export function PublishMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current && !ref.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: 10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen])

  // Use getBoundingClientRect to place the menu nicely below the button
  const buttonRect = ref.current?.getBoundingClientRect()

  return (
    <>
      <div ref={ref}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 font-sans text-sm text-[var(--bg)] px-4 py-2.5 rounded-full border border-transparent select-none transition-transform duration-150 active:scale-95"
          style={{ background: 'var(--accent)', fontWeight: 500 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Publicar algo
        </button>
      </div>

      {isOpen && buttonRect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-48 rounded-xl border border-[var(--border)] overflow-hidden flex flex-col"
          style={{
            top: buttonRect.bottom + 8,
            left: Math.min(buttonRect.left, window.innerWidth - 200), // Prevent going off-screen on the right
            background: 'rgba(17,17,20,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            transformOrigin: 'top left'
          }}
        >
          <button
            onClick={() => navigate('/profile/edit#media')}
            className="flex items-center gap-3 px-4 py-3.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Fotos (Media)
          </button>
          
          <button
            onClick={() => navigate('/profile/edit#musica')}
            className="flex items-center gap-3 px-4 py-3.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors text-left border-t border-[var(--border)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Musica / Videos
          </button>
          
          <button
            onClick={() => navigate('/events/new')}
            className="flex items-center gap-3 px-4 py-3.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors text-left border-t border-[var(--border)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Nuevo Evento
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
