import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { NotificationPreferences } from '../components/notifications/NotificationPreferences.js'
import { NotificationInbox } from '../components/notifications/NotificationInbox.js'
import { revealStagger } from '../utils/motion.js'

export default function Notifications() {
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!headerRef.current) return
    const items = headerRef.current.querySelectorAll('[data-h]')
    if (!items.length) return
    const st = revealStagger(items, headerRef.current, { y: 16, stagger: 0.05 })
    return () => st.kill()
  }, [])

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-20 md:px-8">

        {/* Header */}
        <div ref={headerRef} className="mb-10">
          <div data-h className="flex items-center gap-2 mb-3">
            <Link
              to="/me"
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Mi cuenta
            </Link>
            <span className="text-[var(--text-muted)] opacity-40">/</span>
            <span className="text-xs font-medium text-[var(--text-muted)]">Notificaciones</span>
          </div>
          <h1
            data-h
            className="font-display font-semibold text-[var(--text)] leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}
          >
            Notificaciones
          </h1>
          <p data-h className="text-sm text-[var(--text-muted)] mt-1">
            Gestioná tus preferencias y revisá tu actividad.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* Left: Preferences */}
          <div className="lg:sticky lg:top-24">
            <SectionLabel label="Preferencias" />
            <NotificationPreferences />
          </div>

          {/* Right: Inbox */}
          <div>
            <SectionLabel label="Actividad" />
            <NotificationInbox />
          </div>

        </div>
      </div>
    </main>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)] mb-5">
      {label}
    </p>
  )
}
