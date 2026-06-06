/**
 * ProjectPublishSheet — sheet slide-up para publicar el avance de un proyecto.
 * Incluye: selector de SVG icon, mensaje opcional, opciones de publicación.
 * Se abre desde ProjectDetail cuando el creador presiona "Publicar progreso actual".
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { PROGRESS_SVGS, PROGRESS_SVG_MAP } from './ProjectProgressIcons.js'
import { usePublishProgress } from '../../hooks/useProjects.js'
import { prefersReducedMotion, DURATION, EASE } from '../../utils/motion.js'
import { PROJECT_PHASE_LABELS } from '@dj/shared'
import type { ProjectPhase } from '../../types/index.js'

interface Props {
  projectId: string
  phase: ProjectPhase
  onClose: () => void
  onPublished: (postId: string) => void
}

export function ProjectPublishSheet({ projectId, phase, onClose, onPublished }: Props) {
  const sheetRef   = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [svgKey, setSvgKey]             = useState('note')
  const [message, setMessage]           = useState('')
  const [toFeed, setToFeed]             = useState(true)
  const [toProfile, setToProfile]       = useState(false)
  const [msgFocused, setMsgFocused]     = useState(false)

  const { mutate: publish, isPending } = usePublishProgress(projectId)

  // Slide-up animation
  useEffect(() => {
    const sheet = sheetRef.current
    const ov    = overlayRef.current
    if (!sheet || !ov || prefersReducedMotion()) return
    gsap.fromTo(ov,    { opacity: 0 }, { opacity: 1, duration: DURATION.base, ease: EASE.out })
    gsap.fromTo(sheet, { y: '100%' },  { y: 0, duration: DURATION.base, ease: EASE.softOut })
  }, [])

  const close = useCallback(() => {
    const sheet = sheetRef.current
    const ov    = overlayRef.current
    if (!sheet || !ov || prefersReducedMotion()) { onClose(); return }
    gsap.to(ov,    { opacity: 0, duration: DURATION.micro, ease: EASE.softIn })
    gsap.to(sheet, { y: '100%', duration: DURATION.micro, ease: EASE.softIn, onComplete: onClose })
  }, [onClose])

  function handlePublish() {
    if (!toFeed && !toProfile) return
    publish(
      { svgKey, message: message.trim() || undefined, publishedToFeed: toFeed, publishedToProfile: toProfile },
      {
        onSuccess: (post) => {
          onPublished(post.id)
          close()
        },
      },
    )
  }

  // Checkbox style toggle
  function CheckToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
    return (
      <button
        type="button"
        onClick={onChange}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 0',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: checked ? 'none' : '1.5px solid var(--border)',
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 180ms',
        }}>
          {checked && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={close}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 75 }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 76,
          background: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          padding: '20px 20px calc(32px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 560,
          margin: '0 auto',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
        className="no-scrollbar"
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 4px' }}>
            {PROJECT_PHASE_LABELS[phase]}
          </p>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Publicar avance
          </h2>
        </div>

        {/* SVG icon grid */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Imagen del avance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PROGRESS_SVGS.map((s) => {
              const active = svgKey === s.key
              const renderer = PROGRESS_SVG_MAP[s.key]
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSvgKey(s.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                    background: active ? 'var(--accent-muted)' : 'var(--surface-elevated)',
                    cursor: 'pointer',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'all 150ms',
                  }}
                >
                  {renderer?.(26)}
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, fontWeight: active ? 700 : 500, textAlign: 'center' }}>
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Mensaje (opcional)
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setMsgFocused(true)}
            onBlur={() => setMsgFocused(false)}
            placeholder="Contales en que etapa estan, que lograron, que sigue..."
            maxLength={280}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: msgFocused ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 180ms',
            }}
          />
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', textAlign: 'right' }}>
            {message.length}/280
          </p>
        </div>

        {/* Publish options */}
        <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-elevated)' }}>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Donde publicar
          </p>
          <CheckToggle checked={toFeed} onChange={() => setToFeed(!toFeed)} label="Noticias y feed del inicio" />
          <CheckToggle checked={toProfile} onChange={() => setToProfile(!toProfile)} label="Tambien en mi perfil (Collabs)" />
        </div>

        {(!toFeed && !toProfile) && (
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: '#f87171', margin: '0 0 12px' }}>
            Selecciona al menos una opcion de publicacion.
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || (!toFeed && !toProfile)}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 'var(--radius-xl)',
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--bg)',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: (!toFeed && !toProfile) ? 0.5 : 1,
              transition: 'opacity 150ms',
            }}
          >
            {isPending ? 'Publicando...' : 'Publicar'}
          </button>
          <button
            type="button"
            onClick={close}
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}
