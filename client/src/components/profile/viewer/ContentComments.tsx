import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useAuthStore } from '../../../store/useAuthStore.js'
import {
  useContentComments,
  usePostContentComment,
  useDeleteContentComment,
} from '../../../hooks/useContentSocial.js'

interface ContentCommentsProps {
  profileId: string
  kind: 'photo' | 'media'
  targetId: string
  onClose: () => void
}

export function ContentComments({ profileId, kind, targetId, onClose }: ContentCommentsProps) {
  const { user, token } = useAuthStore()
  const drawerRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')

  const { data: comments = [], isLoading } = useContentComments(profileId, kind, targetId, true)
  const { mutate: post, isPending: posting } = usePostContentComment(profileId, kind, targetId)
  const { mutate: del } = useDeleteContentComment(profileId, kind, targetId)

  useEffect(() => {
    if (!drawerRef.current) return
    gsap.from(drawerRef.current, {
      y: '100%',
      opacity: 0,
      duration: 0.32,
      ease: 'expo.out',
    })
  }, [])

  function handleClose() {
    if (!drawerRef.current) { onClose(); return }
    gsap.to(drawerRef.current, {
      y: '100%',
      opacity: 0,
      duration: 0.22,
      ease: 'expo.in',
      onComplete: onClose,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    post(text.trim(), { onSuccess: () => setText('') })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-[61] lg:bottom-0 lg:right-0 lg:left-auto lg:top-0 lg:w-[420px] flex flex-col rounded-t-2xl lg:rounded-none"
        style={{
          background: 'rgba(17,17,20,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maxHeight: '72vh',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <span className="font-display font-semibold text-[var(--text)] text-sm">Comentarios</span>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
            aria-label="Cerrar comentarios"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && comments.length === 0 && (
            <p className="text-center font-sans text-sm text-[var(--text-muted)] py-8">
              Nadie comentó todavía. ¡Sé el primero!
            </p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-display font-semibold text-xs"
                style={{ background: 'var(--surface-elevated)', color: 'var(--accent)' }}
              >
                {c.userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs text-[var(--text-muted)] mb-0.5">{c.userEmail}</p>
                <p className="font-sans text-sm text-[var(--text)] leading-relaxed">{c.text}</p>
              </div>
              {(c.isOwn || user?.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => del(c.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 font-sans text-xs text-red-400 hover:text-red-300 transition-all duration-150 self-start mt-1"
                  aria-label="Eliminar comentario"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        {token ? (
          <form
            onSubmit={handleSubmit}
            className="px-5 py-4 border-t border-[var(--border)] flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Agregar un comentario..."
              maxLength={500}
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
            />
            <button
              type="submit"
              disabled={!text.trim() || posting}
              className="px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all duration-150 disabled:opacity-40 active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {posting ? '...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <p className="px-5 py-4 border-t border-[var(--border)] font-sans text-xs text-[var(--text-muted)] text-center">
            Inicia sesión para comentar.
          </p>
        )}
      </div>
    </>
  )
}
