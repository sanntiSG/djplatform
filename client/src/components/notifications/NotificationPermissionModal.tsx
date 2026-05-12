import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { Button } from '../ui/Button.js'
import { prefersReducedMotion } from '../../utils/motion.js'

interface Props {
  open: boolean
  onActivate: () => Promise<void>
  onDismiss: () => void
}

export function NotificationPermissionModal({ open, onActivate, onDismiss }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [visible, setVisible] = useState(false)
  const [activating, setActivating] = useState(false)

  // Mount/unmount guard — keep in DOM while animating
  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  useEffect(() => {
    const backdrop = backdropRef.current
    const card = cardRef.current
    if (!backdrop || !card) return

    const items = contentRef.current
      ? Array.from(contentRef.current.querySelectorAll('[data-anim]'))
      : []

    if (tlRef.current) tlRef.current.kill()
    const tl = gsap.timeline()
    tlRef.current = tl

    const reduced = prefersReducedMotion()

    if (open) {
      gsap.set(backdrop, { pointerEvents: 'auto' })
      if (reduced) {
        gsap.set([backdrop, card, ...items], { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
      } else {
        // Phase 1: backdrop fade
        // Phase 2: card rise
        // Phase 3: content stagger
        const isMobile = window.innerWidth < 768
        gsap.set(card, { y: isMobile ? '100%' : 0, scale: isMobile ? 1 : 0.93, opacity: isMobile ? 1 : 0 })
        gsap.set(items, { opacity: 0, y: 12 })
        tl
          .to(backdrop, { opacity: 1, duration: 0.22, ease: 'power2.out' })
          .to(
            card,
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.48,
              ease: 'expo.out',
            },
            '<0.06',
          )
          .to(
            items,
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: 'power3.out',
              stagger: 0.05,
              clearProps: 'transform,opacity',
            },
            '-=0.2',
          )
      }
    } else {
      gsap.set(backdrop, { pointerEvents: 'none' })
      if (reduced) {
        tl.to([backdrop, card], { opacity: 0, duration: 0.18 }).call(() => setVisible(false))
      } else {
        const isMobile = window.innerWidth < 768
        tl
          .to(card, {
            y: isMobile ? '100%' : 0,
            scale: isMobile ? 1 : 0.94,
            opacity: isMobile ? 1 : 0,
            duration: 0.32,
            ease: 'expo.in',
          })
          .to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '<0.08')
          .call(() => setVisible(false))
      }
    }
  }, [open])

  // ESC to dismiss
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onDismiss])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    return () => {
      const savedY = Math.abs(parseInt(document.body.style.top || '0'))
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (savedY) window.scrollTo(0, savedY)
    }
  }, [open])

  async function handleActivate() {
    setActivating(true)
    try {
      await onActivate()
    } finally {
      setActivating(false)
    }
  }

  if (!visible) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onDismiss}
        className="fixed inset-0 z-[90]"
        style={{
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      />

      {/* Card — sheet on mobile, centered on desktop */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-modal-title"
        className={[
          'fixed z-[91] glass-pill',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-[30px]',
          // Desktop: centered card
          'md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-md md:rounded-[var(--radius-xl)]',
        ].join(' ')}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 28px)',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          opacity: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-9 h-[3px] rounded-full bg-white/15" />
        </div>

        <div ref={contentRef} className="px-7 pt-5 pb-2 md:pt-8 md:pb-6 flex flex-col gap-6">
          {/* Icon */}
          <div data-anim className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center"
              style={{ background: 'var(--accent-muted)', boxShadow: '0 0 24px rgba(212,255,0,0.12)' }}
            >
              <BellIcon />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <p
                id="notif-modal-title"
                className="font-display font-semibold text-[var(--text)] leading-tight"
                style={{ fontSize: 'clamp(1.25rem, 4.5vw, 1.5rem)' }}
              >
                Activa tus notificaciones
              </p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed" style={{ maxWidth: '28ch' }}>
                Avisate cuando alguien te siga, reaccione a tu perfil o publique algo nuevo.
              </p>
            </div>
          </div>

          {/* Hint */}
          <p data-anim className="text-xs text-[var(--text-muted)] leading-relaxed px-0.5">
            Podés cambiar esta preferencia en cualquier momento desde{' '}
            <span className="text-[var(--accent)] font-medium">tu perfil &rsaquo; Notificaciones</span>.
          </p>

          {/* Actions */}
          <div data-anim className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleActivate}
              loading={activating}
              className="w-full font-semibold"
            >
              Activar notificaciones
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={onDismiss}
              disabled={activating}
              className="w-full text-[var(--text-muted)]"
            >
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
