import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore.js'
import {
  useProfileComments,
  usePostProfileComment,
  useDeleteProfileComment,
} from '../../hooks/useProfileSocial.js'

interface ProfileCommentsProps {
  profileId: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export function ProfileComments({ profileId }: ProfileCommentsProps) {
  const { token, user } = useAuthStore()
  const { data: comments, isLoading } = useProfileComments(profileId)
  const { mutate: post, isPending: posting } = usePostProfileComment(profileId)
  const { mutate: remove } = useDeleteProfileComment(profileId)
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || posting) return
    post(trimmed, { onSuccess: () => setText('') })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Comment input */}
      {token ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <div
            className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0"
          >
            <span className="font-sans text-xs text-[var(--text-muted)]">
              {user?.email ? initials(user.email) : '?'}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un comentario..."
              maxLength={500}
              rows={2}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] text-[var(--text-muted)]">
                {text.length}/500
              </span>
              <button
                type="submit"
                disabled={!text.trim() || posting}
                className="font-sans text-xs font-medium px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 transition-opacity"
              >
                {posting ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="font-sans text-sm text-[var(--text-muted)]">
          Inicia sesion para dejar un comentario.
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <div
                className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0"
              >
                <span className="font-sans text-xs text-[var(--text-muted)]">
                  {initials(c.userEmail)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-sans text-xs font-medium text-[var(--text)]">
                    {c.userEmail.split('@')[0]}
                  </span>
                  <span className="font-sans text-[10px] text-[var(--text-muted)]">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="font-sans text-sm text-[var(--text)] mt-0.5 leading-relaxed break-words">
                  {c.text}
                </p>
              </div>
              {c.isOwn && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="font-sans text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors flex-shrink-0 mt-1"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-sans text-sm text-[var(--text-muted)] text-center py-8">
          Sin comentarios todavia. Se el primero.
        </p>
      )}
    </div>
  )
}
