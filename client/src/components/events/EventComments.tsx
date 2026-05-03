import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useComments, usePostComment, useDeleteComment } from '../../hooks/useSocial.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { Link } from 'react-router-dom'
import type { CommentResponse } from '../../types/index.js'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function avatar(email: string) {
  return email.charAt(0).toUpperCase()
}

interface CommentItemProps {
  comment: CommentResponse
  eventId: string
  currentUserId?: string
}

function CommentItem({ comment, eventId, currentUserId }: CommentItemProps) {
  const del = useDeleteComment(eventId)
  const isOwn = currentUserId === comment.userId
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' })
  }, [])

  return (
    <div ref={ref} className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
        <span className="font-display text-sm font-semibold text-[var(--text-muted)]">
          {avatar(comment.userEmail)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-xs font-medium text-[var(--text)]">
            {comment.userEmail.split('@')[0]}
          </span>
          <span className="font-sans text-xs text-[var(--text-muted)]">{timeAgo(comment.createdAt)}</span>
          {isOwn && (
            <button
              type="button"
              onClick={() => del.mutate(comment.id)}
              disabled={del.isPending}
              className="ml-auto font-sans text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150"
            >
              Eliminar
            </button>
          )}
        </div>
        <p className="font-sans text-sm text-[var(--text)] mt-1 leading-relaxed break-words">
          {comment.text}
        </p>
      </div>
    </div>
  )
}

interface EventCommentsProps {
  eventId: string
  anchorRef?: React.RefObject<HTMLDivElement>
}

export function EventComments({ eventId, anchorRef }: EventCommentsProps) {
  const { user } = useAuthStore()
  const { data: comments, isLoading } = useComments(eventId)
  const postComment = usePostComment(eventId)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    await postComment.mutateAsync(text.trim())
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim()) postComment.mutate(text.trim(), { onSuccess: () => setText('') })
    }
  }

  return (
    <div ref={anchorRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.15rem' }}>
          Comentarios
        </h2>
        {comments && comments.length > 0 && (
          <span className="font-sans text-xs text-[var(--text-muted)]">{comments.length}</span>
        )}
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Deja un comentario..."
            rows={2}
            maxLength={500}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors duration-150"
          />
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-[var(--text-muted)]">{text.length}/500</span>
            <button
              type="submit"
              disabled={!text.trim() || postComment.isPending}
              className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] font-sans text-sm font-medium disabled:opacity-40 hover:opacity-90 active:scale-[0.97] transition-all duration-100"
            >
              {postComment.isPending ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <p className="font-sans text-sm text-[var(--text-muted)]">
            <Link to="/auth/login" className="text-[var(--accent)] hover:underline">Inicia sesion</Link>
            {' '}para dejar un comentario.
          </p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="flex flex-col gap-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              eventId={eventId}
              currentUserId={user?.id}
            />
          ))}
        </div>
      ) : (
        <p className="font-sans text-sm text-[var(--text-muted)] text-center py-4">
          Se el primero en comentar.
        </p>
      )}
    </div>
  )
}
