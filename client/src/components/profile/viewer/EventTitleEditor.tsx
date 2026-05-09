import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useUpdateEvent } from '../../../hooks/useEvents.js'
import { DURATION, EASE, prefersReducedMotion } from '../../../utils/motion.js'

interface EventTitleEditorProps {
  eventId: string
  title: string
  description?: string
  isOwner: boolean
}

export function EventTitleEditor({ eventId, title, description, isOwner }: EventTitleEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftDesc, setDraftDesc] = useState(description ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const { mutate: update, isPending } = useUpdateEvent()

  useEffect(() => {
    setDraftTitle(title)
    setDraftDesc(description ?? '')
  }, [title, description])

  useEffect(() => {
    if (editing) {
      titleRef.current?.focus()
      titleRef.current?.select()
      if (containerRef.current && !prefersReducedMotion()) {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0.6, y: 6 },
          { opacity: 1, y: 0, duration: DURATION.micro, ease: EASE.out },
        )
      }
    }
  }, [editing])

  function handleSave() {
    const t = draftTitle.trim()
    if (!t) return
    if (t === title && draftDesc.trim() === (description ?? '')) {
      setEditing(false)
      return
    }
    update(
      { id: eventId, data: { title: t, description: draftDesc.trim() || undefined } },
      {
        onSuccess: () => setEditing(false),
        onError: () => {
          setDraftTitle(title)
          setDraftDesc(description ?? '')
        },
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setEditing(false)
      setDraftTitle(title)
      setDraftDesc(description ?? '')
    }
  }

  if (!isOwner) return null

  if (editing) {
    return (
      <div ref={containerRef} className="flex flex-col gap-2 w-full">
        <input
          ref={titleRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } else handleKeyDown(e) }}
          placeholder="Titulo del evento"
          maxLength={120}
          className="w-full bg-black/40 rounded-xl px-4 py-3 font-display font-semibold text-white placeholder:text-white/40 focus:outline-none backdrop-blur-sm"
          style={{ border: '1px solid rgba(255,255,255,0.18)', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}
        />
        <textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descripcion (opcional)"
          rows={2}
          maxLength={1000}
          className="w-full bg-black/40 rounded-xl px-4 py-3 font-sans text-sm text-white placeholder:text-white/40 resize-none focus:outline-none backdrop-blur-sm"
          style={{ border: '1px solid rgba(255,255,255,0.18)' }}
        />
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => { setEditing(false); setDraftTitle(title); setDraftDesc(description ?? '') }}
            className="font-sans text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !draftTitle.trim()}
            className="font-sans text-xs font-medium disabled:opacity-50 transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label="Editar evento"
      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}
