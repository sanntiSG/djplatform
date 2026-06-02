/**
 * OnboardingOverlay
 *
 * Shown over the main feed for guests (users without an account).
 * Adaptive to device/OS. Three steps:
 *   1. Add to home screen (mobile/tablet only — push needs PWA)
 *   2. Create account (CTA to /auth/register)
 *   3. Enable push notifications (Notification.requestPermission)
 *
 * Dismissed state persists in sessionStorage — does not re-appear
 * in the same session after dismissal.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'

const SESSION_KEY = 'onboarding-dismissed-v1'

// ── Device detection ─────────────────────────────────────────────
type DeviceOS = 'ios' | 'android' | 'desktop'

function getDeviceOS(): DeviceOS {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function shouldShowInstallStep(os: DeviceOS): boolean {
  // Only mobile/tablet need the "add to home screen" step; desktop can push natively
  return (os === 'ios' || os === 'android') && !isStandalone()
}

// ── Permission state ─────────────────────────────────────────────
type PermState = 'default' | 'granted' | 'denied' | 'unsupported'

function getPermState(): PermState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as PermState
}

// ── Step IDs — adapted per device ────────────────────────────────
type StepId = 'install' | 'register' | 'push'

function buildSteps(os: DeviceOS): StepId[] {
  const steps: StepId[] = []
  if (shouldShowInstallStep(os)) steps.push('install')
  steps.push('register')
  steps.push('push')
  return steps
}

// ── Icons ─────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #d4ff00)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  )
}

function PlusBoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #d4ff00)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #d4ff00)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function BellIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Inline step indicator ─────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 3,
            background: i === current ? 'var(--accent, #d4ff00)' : 'rgba(255,255,255,0.15)',
            transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.2s',
          }}
        />
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
interface Props {
  onDismiss: () => void
}

export function OnboardingOverlay({ onDismiss }: Props) {
  const navigate = useNavigate()
  const { canInstallNative, installNow } = useInstallPrompt()

  const [os] = useState<DeviceOS>(() => getDeviceOS())
  const [steps] = useState<StepId[]>(() => buildSteps(os))
  const [stepIndex, setStepIndex] = useState(0)
  const [permState, setPermState] = useState<PermState>(getPermState)
  const [requestingPerm, setRequestingPerm] = useState(false)
  const [installingNative, setInstallingNative] = useState(false)

  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const stepContentRef = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  const currentStep = steps[stepIndex]
  const totalSteps = steps.length

  // ── Entrance animation
  useEffect(() => {
    const backdrop = backdropRef.current
    const card = cardRef.current
    if (!backdrop || !card) return

    if (reduced) {
      gsap.set([backdrop, card], { opacity: 1, y: 0 })
      return
    }

    const isMobile = window.innerWidth < 768
    gsap.set(backdrop, { opacity: 0 })
    gsap.set(card, { y: isMobile ? 80 : 32, opacity: 0, scale: isMobile ? 1 : 0.94 })

    gsap.timeline()
      .to(backdrop, { opacity: 1, duration: DURATION.base, ease: EASE.out })
      .to(
        card,
        { y: 0, opacity: 1, scale: 1, duration: 0.52, ease: 'expo.out' },
        '-=0.16',
      )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Animate step content when step changes
  const animateStepTransition = useCallback((direction: 'forward' | 'back') => {
    const el = stepContentRef.current
    if (!el || reduced) return
    const xOut = direction === 'forward' ? -24 : 24
    const xIn = direction === 'forward' ? 24 : -24
    gsap.timeline()
      .to(el, { opacity: 0, x: xOut, duration: 0.18, ease: 'power2.in' })
      .set(el, { x: xIn })
      .to(el, { opacity: 1, x: 0, duration: 0.28, ease: 'expo.out' })
  }, [reduced])

  // ── Dismiss: animate out then call onDismiss
  const handleDismiss = useCallback(() => {
    const backdrop = backdropRef.current
    const card = cardRef.current

    if (!backdrop || !card || reduced) {
      onDismiss()
      return
    }

    const isMobile = window.innerWidth < 768
    gsap.timeline()
      .to(card, { y: isMobile ? 80 : 24, opacity: 0, scale: isMobile ? 1 : 0.95, duration: 0.3, ease: 'power2.in' })
      .to(backdrop, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '-=0.14')
      .call(onDismiss)
  }, [onDismiss, reduced])

  // ── ESC to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDismiss() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleDismiss])

  // ── Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function goNext() {
    if (stepIndex < totalSteps - 1) {
      animateStepTransition('forward')
      setStepIndex(i => i + 1)
    } else {
      handleDismiss()
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      animateStepTransition('back')
      setStepIndex(i => i - 1)
    }
  }

  async function handleInstallNative() {
    setInstallingNative(true)
    const outcome = await installNow()
    setInstallingNative(false)
    if (outcome === 'accepted') goNext()
  }

  async function handleRequestPush() {
    setRequestingPerm(true)
    try {
      const result = await Notification.requestPermission()
      setPermState(result as PermState)
    } catch {
      setPermState('denied')
    } finally {
      setRequestingPerm(false)
    }
  }

  function handleRegister() {
    handleDismiss()
    navigate('/auth/register')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(8,8,10,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer',
        }}
        aria-hidden="true"
      />

      {/* Card — bottom sheet on mobile, centered on desktop */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenido a REsonar"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 401,
          background: 'var(--surface, #111114)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          padding: 'clamp(24px, 4vw, 36px) clamp(20px, 5vw, 32px)',
          paddingBottom: 'max(clamp(24px, 4vw, 36px), env(safe-area-inset-bottom))',
          maxWidth: 520,
          margin: '0 auto',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,255,0,0.06)',
          overflow: 'hidden',
        }}
        className="md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:bottom-auto md:right-auto md:left-1/2"
        onClick={e => e.stopPropagation()}
      >
        {/* Header row: step dots + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <StepDots total={totalSteps} current={stepIndex} />
          <button
            onClick={handleDismiss}
            aria-label="Cerrar"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'rgba(242,242,247,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = 'rgba(242,242,247,0.85)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = 'rgba(242,242,247,0.5)'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Step content */}
        <div ref={stepContentRef} style={{ willChange: 'transform, opacity' }}>
          {currentStep === 'install' && (
            <InstallStep
              os={os}
              canInstallNative={canInstallNative}
              installing={installingNative}
              onInstallNative={handleInstallNative}
              onSkip={goNext}
              onContinue={goNext}
            />
          )}
          {currentStep === 'register' && (
            <RegisterStep
              onRegister={handleRegister}
              onNext={goNext}
            />
          )}
          {currentStep === 'push' && (
            <PushStep
              os={os}
              permState={permState}
              requesting={requestingPerm}
              needsPWA={shouldShowInstallStep(os) && !isStandalone()}
              onRequestPerm={handleRequestPush}
              onBack={stepIndex > 0 ? goBack : undefined}
              onDone={handleDismiss}
            />
          )}
        </div>
      </div>
    </>
  )
}

// ── Step: Install / Add to home screen ────────────────────────────
interface InstallStepProps {
  os: DeviceOS
  canInstallNative: boolean
  installing: boolean
  onInstallNative: () => void
  onSkip: () => void
  onContinue: () => void
}

function InstallStep({ os, canInstallNative, installing, onInstallNative, onSkip, onContinue }: InstallStepProps) {
  const reduced = prefersReducedMotion()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Icon + heading */}
      <div>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #d4ff00)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="12" height="20" x="6" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <h2 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', fontWeight: 700,
          color: 'var(--text, #f2f2f7)', margin: '0 0 8px', letterSpacing: '-0.015em',
        }}>
          Instalá REsonar en tu {os === 'ios' ? 'iPhone / iPad' : 'dispositivo'}
        </h2>
        <p style={{
          fontFamily: 'Satoshi, sans-serif', fontSize: 'clamp(0.82rem, 2vw, 0.9rem)',
          color: 'rgba(242,242,247,0.55)', margin: 0, lineHeight: 1.6,
        }}>
          Las notificaciones push en mobile solo funcionan si la app esta instalada desde la pantalla de inicio.
        </p>
      </div>

      {/* Steps: iOS manual or Android native */}
      {os === 'ios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <ShareIcon />, text: 'Toca el boton de compartir en Safari' },
            { icon: <PlusBoxIcon />, text: 'Selecciona Agregar a pantalla de inicio' },
            { icon: <CheckIcon />, text: 'Toca Agregar para confirmar' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(212,255,0,0.07)', border: '1px solid rgba(212,255,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <p style={{
                fontFamily: 'Satoshi, sans-serif', fontSize: '0.88rem',
                color: 'rgba(242,242,247,0.75)', margin: 0, lineHeight: 1.45,
              }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {os === 'android' && canInstallNative && (
        <div style={{ background: 'rgba(212,255,0,0.06)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{
            fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem',
            color: 'rgba(242,242,247,0.6)', margin: '0 0 12px', lineHeight: 1.55,
          }}>
            Tu navegador permite instalar REsonar como app directamente con un tap.
          </p>
          <button
            onClick={onInstallNative}
            disabled={installing}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'var(--accent, #d4ff00)', color: '#0a0a0a',
              border: 'none', fontFamily: 'Satoshi, sans-serif',
              fontWeight: 700, fontSize: '0.9rem', cursor: installing ? 'not-allowed' : 'pointer',
              opacity: installing ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!installing && !reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro }) }}
            onMouseLeave={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro }) }}
          >
            {installing ? 'Instalando...' : 'Instalar app'}
          </button>
        </div>
      )}

      {os === 'android' && !canInstallNative && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{
            fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem',
            color: 'rgba(242,242,247,0.55)', margin: 0, lineHeight: 1.55,
          }}>
            Toca el menu de tu navegador y selecciona <strong style={{ color: 'rgba(242,242,247,0.8)' }}>Agregar a pantalla de inicio</strong> o <strong style={{ color: 'rgba(242,242,247,0.8)' }}>Instalar app</strong>.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(os !== 'android' || !canInstallNative) && (
          <button
            onClick={onContinue}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              background: 'var(--accent, #d4ff00)', color: '#0a0a0a',
              border: 'none', fontFamily: 'Satoshi, sans-serif',
              fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro }) }}
            onMouseLeave={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro }) }}
          >
            {os === 'ios' ? 'Ya lo instale' : 'Continuar'}
          </button>
        )}
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 14,
            background: 'transparent', color: 'rgba(242,242,247,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Satoshi, sans-serif', fontWeight: 500, fontSize: '0.88rem',
            cursor: 'pointer', transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.4)' }}
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}

// ── Step: Create account ──────────────────────────────────────────
interface RegisterStepProps {
  onRegister: () => void
  onNext: () => void
}

function RegisterStep({ onRegister, onNext }: RegisterStepProps) {
  const reduced = prefersReducedMotion()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Icon + heading */}
      <div>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #d4ff00)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', fontWeight: 700,
          color: 'var(--text, #f2f2f7)', margin: '0 0 8px', letterSpacing: '-0.015em',
        }}>
          Crea tu cuenta en REsonar
        </h2>
        <p style={{
          fontFamily: 'Satoshi, sans-serif', fontSize: 'clamp(0.82rem, 2vw, 0.9rem)',
          color: 'rgba(242,242,247,0.55)', margin: 0, lineHeight: 1.6,
        }}>
          Publica tu perfil de DJ o productor, agenda eventos, conecta con otros artistas y recibe oportunidades en la escena argentina.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['Perfil publico', 'Publicar eventos', 'Biblioteca musical', 'Conectar artistas'].map(f => (
          <span
            key={f}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '5px 12px', borderRadius: 999,
              border: '1px solid rgba(212,255,0,0.2)',
              background: 'rgba(212,255,0,0.06)',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: '0.75rem', fontWeight: 600,
              color: 'rgba(212,255,0,0.8)',
              letterSpacing: '0.02em',
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onRegister}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: 'var(--accent, #d4ff00)', color: '#0a0a0a',
            border: 'none', fontFamily: 'Satoshi, sans-serif',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 0 32px rgba(212,255,0,0.18), 0 4px 16px rgba(0,0,0,0.25)',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            if (!reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro })
            e.currentTarget.style.boxShadow = '0 0 52px rgba(212,255,0,0.3), 0 4px 20px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={e => {
            if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro })
            e.currentTarget.style.boxShadow = '0 0 32px rgba(212,255,0,0.18), 0 4px 16px rgba(0,0,0,0.25)'
          }}
        >
          Crear cuenta gratis
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onNext}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 14,
            background: 'transparent', color: 'rgba(242,242,247,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Satoshi, sans-serif', fontWeight: 500, fontSize: '0.88rem',
            cursor: 'pointer', transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.4)' }}
        >
          Mas tarde
        </button>
      </div>
    </div>
  )
}

// ── Step: Enable push notifications ──────────────────────────────
interface PushStepProps {
  os: DeviceOS
  permState: PermState
  requesting: boolean
  needsPWA: boolean
  onRequestPerm: () => void
  onBack?: () => void
  onDone: () => void
}

function PushStep({ os, permState, requesting, needsPWA, onRequestPerm, onBack, onDone }: PushStepProps) {
  const reduced = prefersReducedMotion()
  const isDesktop = os === 'desktop'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Icon + heading */}
      <div>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: permState === 'granted' ? 'rgba(212,255,0,0.1)' : 'rgba(139,92,246,0.12)',
          border: permState === 'granted' ? '1px solid rgba(212,255,0,0.2)' : '1px solid rgba(139,92,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <BellIcon color={permState === 'granted' ? 'var(--accent, #d4ff00)' : '#a78bfa'} />
        </div>
        <h2 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', fontWeight: 700,
          color: 'var(--text, #f2f2f7)', margin: '0 0 8px', letterSpacing: '-0.015em',
        }}>
          {permState === 'granted' ? 'Notificaciones activadas' : 'Activa las notificaciones'}
        </h2>
        <p style={{
          fontFamily: 'Satoshi, sans-serif', fontSize: 'clamp(0.82rem, 2vw, 0.9rem)',
          color: 'rgba(242,242,247,0.55)', margin: 0, lineHeight: 1.6,
        }}>
          {permState === 'granted'
            ? 'Vas a recibir notificaciones de nuevos eventos, oportunidades y actividad en tu perfil.'
            : permState === 'denied'
              ? 'Los permisos estan bloqueados. Desde la configuracion de tu navegador podes habilitarlos para REsonar.'
              : needsPWA && !isDesktop
                ? 'Para recibir notificaciones push en mobile, la app debe estar instalada desde la pantalla de inicio (paso anterior).'
                : isDesktop
                  ? 'En desktop las notificaciones funcionan directamente desde el navegador, sin instalar nada.'
                  : 'Recibe alertas de nuevos eventos, colaboraciones y mensajes directamente en tu dispositivo.'}
        </p>
      </div>

      {/* Action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {permState === 'granted' && (
          <button
            onClick={onDone}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'var(--accent, #d4ff00)', color: '#0a0a0a',
              border: 'none', fontFamily: 'Satoshi, sans-serif',
              fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro }) }}
            onMouseLeave={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro }) }}
          >
            Listo
          </button>
        )}

        {permState === 'default' && !requesting && (
          <button
            onClick={onRequestPerm}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              background: 'rgba(139,92,246,0.85)', color: '#fff',
              border: '1px solid rgba(139,92,246,0.5)',
              fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
              fontSize: '0.92rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!reduced) gsap.to(e.currentTarget, { scale: 1.02, duration: DURATION.micro })
              e.currentTarget.style.background = 'rgba(139,92,246,1)'
            }}
            onMouseLeave={e => {
              if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: DURATION.micro })
              e.currentTarget.style.background = 'rgba(139,92,246,0.85)'
            }}
          >
            <BellIcon color="#fff" />
            Activar notificaciones
          </button>
        )}

        {requesting && (
          <div style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            background: 'rgba(139,92,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Satoshi, sans-serif', fontSize: '0.92rem',
            color: 'rgba(242,242,247,0.5)',
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#a78bfa',
              display: 'inline-block', animation: 'onb-spin 0.75s linear infinite',
            }} />
            Esperando permiso...
          </div>
        )}

        {(permState === 'denied' || permState === 'unsupported') && (
          <button
            onClick={onDone}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(242,242,247,0.65)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'Satoshi, sans-serif', fontWeight: 600,
              fontSize: '0.88rem', cursor: 'pointer',
            }}
          >
            Entendido
          </button>
        )}

        {onBack && permState !== 'granted' && (
          <button
            onClick={onBack}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 14,
              background: 'transparent', color: 'rgba(242,242,247,0.35)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'Satoshi, sans-serif', fontWeight: 500, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.35)' }}
          >
            Volver
          </button>
        )}
      </div>
    </div>
  )
}

// ── Gate component — handles sessionStorage flag ──────────────────
export function OnboardingGate() {
  const [show, setShow] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    return !sessionStorage.getItem(SESSION_KEY)
  })

  function handleDismiss() {
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
    setShow(false)
  }

  if (!show) return null
  return <OnboardingOverlay onDismiss={handleDismiss} />
}

// CSS keyframe for spinner
const spinStyle = (
  <style>{`@keyframes onb-spin { to { transform: rotate(360deg); } }`}</style>
)

// Inject spin style once
if (typeof document !== 'undefined' && !document.getElementById('onb-spin-style')) {
  const s = document.createElement('style')
  s.id = 'onb-spin-style'
  s.textContent = '@keyframes onb-spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(s)
}

export { spinStyle }
