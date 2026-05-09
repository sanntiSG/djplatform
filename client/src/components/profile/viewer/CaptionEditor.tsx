import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useUpdatePhotoCaption } from '../../../hooks/useProfile.js'
import { DURATION, EASE, prefersReducedMotion } from '../../../utils/motion.js'

interface CaptionEditorProps {
  photoId: string
  caption?: string
  isOwner: boolean
  profileQueryKey: string
}

export function CaptionEditor({ photoId, caption, isOwner, profileQueryKey }: CaptionEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(caption ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { mutate: save, isPending } = useUpdatePhotoCaption(profileQueryKey)

  useEffect(() => {
    setDraft(caption ?? '')
  }, [caption])

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
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
    if (draft.trim() === (caption ?? '')) { setEditing(false); return }
    save(
      { photoId, caption: draft.trim() },
      { onSuccess: () => setEditing(false), onError: () => setDraft(caption ?? '') },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { setEditing(false); setDraft(caption ?? '') }
  }

  if (!caption && !isOwner) return null

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-24 pt-16 lg:pb-8 lg:pr-24"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
    >
      {editing ? (
        <div ref={containerRef} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Agrega una descripcion..."
            rows={2}
            maxLength={500}
            className="w-full bg-black/40 rounded-xl px-4 py-3 font-sans text-base sm:text-sm text-white placeholder:text-white/40 resize-none focus:outline-none backdrop-blur-sm"
            style={{ border: '1px solid rgba(255,255,255,0.18)' }}
          />
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-white/40">{draft.length}/500</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(caption ?? '') }}
                className="font-sans text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="font-sans text-xs font-medium disabled:opacity-50 transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {caption ? (
            <p className="font-sans text-sm text-white/85 leading-relaxed flex-1">
              {caption}
            </p>
          ) : (
            <p className="font-sans text-xs text-white/30 italic flex-1">
              Sin descripcion
            </p>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar descripcion"
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 mb-0.5"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
