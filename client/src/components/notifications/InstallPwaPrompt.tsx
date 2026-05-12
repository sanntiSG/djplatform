import { useRef, useEffect, type ReactNode } from 'react'
import gsap from 'gsap'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'

interface Props {
  onClose: () => void
}

export function InstallPwaPrompt({ onClose }: Props) {
  const { canInstallNative, isIOS, installNow, dismiss } = useInstallPrompt()
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const backdrop = backdropRef.current
    const sheet = sheetRef.current
    const steps = stepsRef.current
    if (!backdrop || !sheet) return

    if (prefersReducedMotion()) {
      gsap.set([backdrop, sheet], { opacity: 1, y: 0 })
      return
    }

    gsap.set(backdrop, { opacity: 0 })
    gsap.set(sheet, { y: '100%' })

    const tl = gsap.timeline()
    tl.to(backdrop, { opacity: 1, duration: DURATION.base, ease: EASE.softOut })
      .to(sheet, { y: 0, duration: 0.44, ease: `cubic-bezier(${EASE.iosSpring.join(',')})` }, '-=0.12')

    if (steps) {
      const items = steps.querySelectorAll('[data-step]')
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 12 })
        tl.to(items, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.softOut, stagger: 0.06 }, '-=0.2')
      }
    }
  }, [])

  function handleClose() {
    const backdrop = backdropRef.current
    const sheet = sheetRef.current
    if (!backdrop || !sheet || prefersReducedMotion()) { dismiss(); onClose(); return }

    gsap.timeline()
      .to(sheet, { y: '100%', duration: 0.28, ease: EASE.softIn })
      .to(backdrop, { opacity: 0, duration: DURATION.base, ease: EASE.softIn }, '-=0.16')
      .call(() => { dismiss(); onClose() })
  }

  async function handleInstallNative() {
    const outcome = await installNow()
    if (outcome === 'accepted') onClose()
  }

  return (
    <div className="fixed inset-0 z-[100]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-[var(--surface)] rounded-t-[var(--radius-xl)] px-5 py-6',
          'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-sm md:rounded-[var(--radius-xl)]',
          'safe-bottom',
        )}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.15rem' }}>
              {isIOS ? 'Instala REsonar en tu iPhone' : 'Instala la app'}
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isIOS
                ? 'Agrega REsonar a tu pantalla de inicio para recibir notificaciones push.'
                : 'Instala la app para recibir notificaciones incluso cuando no estes en el sitio.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps: iOS manual flow */}
        {isIOS && (
          <div ref={stepsRef} className="flex flex-col gap-3 mb-6">
            <Step number="1" text="Toca el boton de compartir en Safari">
              {/* iOS Share icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
            </Step>
            <Step number="2" text="Busca 'Agregar a pantalla de inicio'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </Step>
            <Step number="3" text="Toca 'Agregar' para confirmar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </Step>
            <Step number="4" text="Abre REsonar desde el icono nuevo y activa las notificaciones">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Step>
          </div>
        )}

        {/* Native install for Chrome/Edge/Android */}
        {!isIOS && canInstallNative && (
          <div ref={stepsRef} className="mb-6">
            <div data-step className="bg-[var(--surface-elevated)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              Tu navegador permite instalar REsonar como aplicacion directamente. La experiencia es identica a una app nativa.
            </div>
            <button
              type="button"
              onClick={handleInstallNative}
              className="w-full bg-[var(--accent)] text-[var(--bg)] font-semibold text-sm rounded-[var(--radius-md)] py-3 hover:opacity-90 transition-opacity"
            >
              Instalar app
            </button>
          </div>
        )}

        {/* Unsupported browser fallback */}
        {!isIOS && !canInstallNative && (
          <div ref={stepsRef} className="mb-6">
            <div data-step className="bg-[var(--surface-elevated)] rounded-[var(--radius-md)] px-4 py-3 text-xs text-[var(--text-muted)] leading-relaxed">
              Las notificaciones push estan disponibles en Chrome, Edge, Firefox y Safari (iOS 16.4+). Si estas usando un navegador distinto, proba con uno de estos.
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-1"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}

function Step({ number, text, children }: { number: string; text: string; children: ReactNode }) {
  return (
    <div data-step className="flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
        {number}
      </div>
      <span className="text-sm text-[var(--text)] leading-snug flex-1">{text}</span>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
