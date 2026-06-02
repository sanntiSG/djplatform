import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'

interface Props {
  open: boolean
  isLoading: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export function DeleteAccountModal({ open, isLoading, onConfirm, onDismiss }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [visible, setVisible] = useState(false)
  const reduced = prefersReducedMotion()

  // Keep in DOM while animating out
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

    if (open) {
      gsap.set(backdrop, { pointerEvents: 'auto' })
      if (reduced) {
        gsap.set([backdrop, card, ...items], { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
      } else {
        const isMobile = window.innerWidth < 768
        gsap.set(card, { y: isMobile ? '100%' : 0, scale: isMobile ? 1 : 0.93, opacity: isMobile ? 1 : 0 })
        gsap.set(items, { opacity: 0, y: 10 })
        tl
          .to(backdrop, { opacity: 1, duration: 0.22, ease: 'power2.out' })
          .to(
            card,
            { y: 0, scale: 1, opacity: 1, duration: 0.48, ease: 'expo.out' },
            '<0.06',
          )
          .to(
            items,
            { opacity: 1, y: 0, duration: 0.28, ease: 'power3.out', stagger: 0.045, clearProps: 'transform,opacity' },
            '-=0.2',
          )
      }
    } else {
      gsap.set(backdrop, { pointerEvents: 'none' })
      if (reduced) {
        gsap.set([backdrop, card], { opacity: 0 })
        setVisible(false)
      } else {
        tl
          .to(card, { y: window.innerWidth < 768 ? '100%' : 0, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' })
          .to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '<0.08')
          .call(() => setVisible(false))
      }
    }
  }, [open, reduced])

  // ESC to dismiss
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onDismiss])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!visible) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={isLoading ? undefined : onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          opacity: 0,
          cursor: isLoading ? 'default' : 'pointer',
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        style={{
          position: 'fixed', zIndex: 801,
          background: 'var(--surface, #111114)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,80,80,0.12)',
          // Mobile: bottom sheet; Desktop: centered dialog
          bottom: 0, left: 0, right: 0,
          borderRadius: '24px 24px 0 0',
          padding: 'clamp(28px, 5vw, 40px) clamp(20px, 5vw, 36px)',
          paddingBottom: 'max(clamp(28px, 5vw, 40px), env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
        }}
        className="md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:bottom-auto md:right-auto md:left-1/2"
      >
        <div ref={contentRef} className="flex flex-col gap-5">
          {/* Warning icon */}
          <div
            data-anim
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Heading */}
          <div data-anim>
            <h2
              id="delete-account-title"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(1.15rem, 3vw, 1.35rem)',
                fontWeight: 700,
                color: 'var(--text, #f2f2f7)',
                margin: '0 0 8px',
                letterSpacing: '-0.015em',
              }}
            >
              Eliminar cuenta
            </h2>
            <p style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 'clamp(0.82rem, 2vw, 0.9rem)',
              color: 'rgba(242,242,247,0.55)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Esta accion es <strong style={{ color: 'rgba(239,68,68,0.85)' }}>permanente e irreversible</strong>.
              Se eliminaran tu perfil, publicaciones, canciones, comentarios, likes, biblioteca y datos de autenticacion.
              No hay forma de recuperar nada despues de confirmar.
            </p>
          </div>

          {/* Action buttons */}
          <div data-anim style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px 20px',
                borderRadius: 14,
                background: isLoading ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.9)',
                color: '#fff',
                border: '1px solid rgba(239,68,68,0.5)',
                fontFamily: 'Satoshi, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.18s, opacity 0.18s',
              }}
              onMouseEnter={e => {
                if (!isLoading && !reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro, ease: EASE.out })
              }}
              onMouseLeave={e => {
                if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro, ease: EASE.out })
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                    animation: 'spin 0.75s linear infinite',
                  }} />
                  Eliminando...
                </>
              ) : (
                'Eliminar definitivamente'
              )}
            </button>

            <button
              onClick={onDismiss}
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px 20px',
                borderRadius: 14,
                background: 'transparent',
                color: 'rgba(242,242,247,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Satoshi, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = 'rgba(242,242,247,0.85)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(242,242,247,0.6)'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>,
    document.body,
  )
}
