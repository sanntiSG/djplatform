import { useRef, useEffect, useState } from 'react'
import type React from 'react'
import gsap from 'gsap'
import { Toggle } from '../ui/Toggle.js'
import { useNotificationTypes, useNotificationPrefs } from '../../hooks/useNotificationPrefs.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import * as pushService from '../../services/pushService.js'
import { useToastStore } from '../../store/useToastStore.js'
import { reasonToMessage } from '../../utils/pushReasons.js'
import { revealStagger, prefersReducedMotion } from '../../utils/motion.js'
import type { NotificationPreferences as Prefs } from '../../services/notificationsService.js'

export function NotificationPreferences() {
  const { user, token, setAuth } = useAuthStore()
  const { show: showToast } = useToastStore()
  const { data: types } = useNotificationTypes()
  const { data: prefs, update, isUpdating, updateError, resetUpdateError } = useNotificationPrefs()
  const containerRef = useRef<HTMLDivElement>(null)
  const levelTrackRef = useRef<HTMLDivElement>(null)
  const levelThumbRef = useRef<HTMLDivElement>(null)
  const [testingPush, setTestingPush] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const items = containerRef.current.querySelectorAll('[data-reveal]')
    if (!items.length) return
    const st = revealStagger(items, containerRef.current, { y: 20, stagger: 0.04 })
    return () => st.kill()
  }, [!!prefs, !!types])

  // Animate level selector thumb
  useEffect(() => {
    const track = levelTrackRef.current
    const thumb = levelThumbRef.current
    if (!track || !thumb || !prefs) return
    const isAll = prefs.notificationLevel === 'all'
    const reduced = prefersReducedMotion()
    gsap.to(thumb, {
      x: isAll ? track.offsetWidth / 2 : 0,
      duration: reduced ? 0 : 0.32,
      ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
    })
  }, [prefs?.notificationLevel])

  async function handlePushToggle(val: boolean) {
    if (val) {
      // Optimistic: update UI immediately
      update({ pushOptIn: true })
      if (user && token) setAuth(token, { ...user, pushOptIn: true })

      const result = await pushService.subscribe()
      if (!result.ok) {
        // Rollback
        update({ pushOptIn: false })
        if (user && token) setAuth(token, { ...user, pushOptIn: false })
        if (result.reason === 'ios-needs-pwa') {
          setShowInstallPrompt(true)
          return
        }
        showToast(reasonToMessage(result.reason), 'error')
        return
      }
      showToast('Notificaciones push activadas.', 'success')
    } else {
      // Optimistic: update UI immediately
      update({ pushOptIn: false })
      if (user && token) setAuth(token, { ...user, pushOptIn: false })
      // Fire-and-forget the unsubscribe cleanup
      pushService.unsubscribe().catch(() => {})
    }
  }

  async function handleTestPush() {
    setTestingPush(true)
    try {
      const result = await pushService.testPushSelf()
      if (result.attempted === 0) {
        showToast('Sin dispositivos registrados. Desactiva y vuelve a activar las notificaciones.', 'info')
      } else {
        showToast('Push de prueba enviado. Deberia aparecer en segundos.', 'success')
      }
    } catch {
      showToast('Error al enviar push de prueba.', 'error')
    } finally {
      setTestingPush(false)
    }
  }

  function handleLevelChange(level: 'profile' | 'all') {
    update({ notificationLevel: level })
  }

  function handleOverride(key: string, enabled: boolean) {
    update({ overrides: { [key]: enabled } })
  }

  if (!prefs) return <PrefsSkeleton />

  const profileTypes = (types ?? []).filter(t => t.category === 'profile')
  const allTypes = (types ?? []).filter(t => t.category === 'all')

  const iosWithoutPwa = typeof window !== 'undefined'
    && /iPad|iPhone|iPod/.test(navigator.userAgent || '')
    && !window.matchMedia('(display-mode: standalone)').matches

  return (
    <div ref={containerRef} className="flex flex-col gap-7">

      {/* Sync error hint — discrete, auto-dismissible */}
      {updateError && (
        <section className="flex items-center gap-2.5 bg-white/[0.03] rounded-[var(--radius-md)] px-4 py-3 border border-white/5 slide-up-in">
          <svg className="shrink-0 text-[var(--text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">
            No se pudo guardar el cambio. Intenta recargar la pagina.
          </p>
          <button
            type="button"
            onClick={() => { resetUpdateError(); window.location.reload() }}
            className="shrink-0 text-[10px] font-semibold text-[var(--accent)] hover:opacity-75 transition-opacity"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={resetUpdateError}
            className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
            aria-label="Cerrar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </section>
      )}

      {/* iOS banner */}
      {iosWithoutPwa && (
        <section data-reveal className="bg-[var(--accent)]/8 rounded-[var(--radius-lg)] p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <svg className="shrink-0 mt-0.5 text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              Para activar notificaciones en iPhone, primero agrega REsonar a tu pantalla de inicio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallPrompt(true)}
            className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:opacity-75 transition-opacity whitespace-nowrap"
          >
            Como hacerlo
          </button>
        </section>
      )}

      {/* Push global toggle */}
      <section data-reveal className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.05rem' }}>
              Notificaciones push
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed" style={{ maxWidth: '28ch' }}>
              Recibir alertas del navegador aunque no estes en la plataforma.
            </p>
          </div>
          <Toggle
            checked={prefs.pushOptIn}
            onChange={handlePushToggle}
            disabled={isUpdating}
          />
        </div>
        {prefs.pushOptIn && (
          <button
            type="button"
            onClick={handleTestPush}
            disabled={testingPush}
            className="self-start text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-40"
          >
            {testingPush ? 'Enviando...' : 'Enviar push de prueba'}
          </button>
        )}
      </section>

      {/* Level selector */}
      <section data-reveal className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Nivel de notificaciones
        </p>
        <div
          ref={levelTrackRef}
          className="relative grid grid-cols-2 bg-[var(--surface)] rounded-[var(--radius-md)] p-1 overflow-hidden"
        >
          {/* Sliding thumb */}
          <div
            ref={levelThumbRef}
            aria-hidden
            className="absolute top-1 bottom-1 left-1 bg-[var(--surface-elevated)] rounded-[10px] pointer-events-none"
            style={{
              width: 'calc(50% - 4px)',
              willChange: 'transform',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
          <LevelOption
            active={prefs.notificationLevel === 'profile'}
            label="Solo perfil"
            sublabel="Seguidores y reacciones"
            onClick={() => handleLevelChange('profile')}
          />
          <LevelOption
            active={prefs.notificationLevel === 'all'}
            label="Todas"
            sublabel="Eventos, musica y chats"
            onClick={() => handleLevelChange('all')}
          />
        </div>
      </section>

      {/* Profile types */}
      {profileTypes.length > 0 && (
        <section data-reveal className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Perfil</p>
          <div className="flex flex-col gap-2">
            {profileTypes.map(t => (
              <TypeRow
                key={t.key}
                label={t.label}
                description={t.description}
                enabled={t.userEnabled && t.enabledByAdmin}
                disabledByAdmin={!t.enabledByAdmin}
                onChange={val => handleOverride(t.key, val)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All types */}
      {allTypes.length > 0 && prefs.notificationLevel === 'all' && (
        <section data-reveal className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Actividad extendida</p>
          <div className="flex flex-col gap-2">
            {allTypes.map(t => (
              <TypeRow
                key={t.key}
                label={t.label}
                description={t.description}
                enabled={t.userEnabled && t.enabledByAdmin}
                disabledByAdmin={!t.enabledByAdmin}
                onChange={val => handleOverride(t.key, val)}
              />
            ))}
          </div>
        </section>
      )}

      {allTypes.length > 0 && prefs.notificationLevel === 'profile' && (
        <p data-reveal className="text-xs text-[var(--text-muted)] text-center">
          Cambia a "Todas" para ver las notificaciones de eventos y mensajes.
        </p>
      )}

      {showInstallPrompt && (
        <InstallPwaPromptInline onClose={() => setShowInstallPrompt(false)} />
      )}
    </div>
  )
}

function InstallPwaPromptInline({ onClose }: { onClose: () => void }) {
  const [Comp, setComp] = useState<React.ComponentType<{ onClose: () => void }> | null>(null)
  useEffect(() => {
    import('../../components/notifications/InstallPwaPrompt.js').then(m => setComp(() => m.InstallPwaPrompt))
  }, [])
  if (!Comp) return null
  return <Comp onClose={onClose} />
}

function LevelOption({ active, label, sublabel, onClick }: {
  active: boolean
  label: string
  sublabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative z-10 flex flex-col items-center py-3 px-2 rounded-[10px] transition-colors duration-150"
    >
      <span className={`text-sm font-semibold font-sans transition-colors duration-150 ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
      <span className={`text-[11px] transition-colors duration-150 ${active ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]/50'}`}>
        {sublabel}
      </span>
    </button>
  )
}

function TypeRow({ label, description, enabled, disabledByAdmin, onChange }: {
  label: string
  description: string
  enabled: boolean
  disabledByAdmin: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 bg-[var(--surface)] rounded-[var(--radius-md)] px-4 py-3 transition-opacity duration-200 ${disabledByAdmin ? 'opacity-40' : 'opacity-100'}`}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        <span className="text-xs text-[var(--text-muted)] leading-relaxed truncate">{description}</span>
        {disabledByAdmin && (
          <span className="text-[10px] text-[var(--text-muted)] mt-0.5">Desactivado por el equipo</span>
        )}
      </div>
      <Toggle
        checked={enabled && !disabledByAdmin}
        onChange={onChange}
        disabled={disabledByAdmin}
      />
    </div>
  )
}

function PrefsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 rounded-[var(--radius-lg)] skeleton-shimmer" />
      ))}
    </div>
  )
}
