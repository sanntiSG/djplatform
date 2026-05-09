import { useState, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'

export interface ThreadComment {
  id: string
  userId: string
  userEmail: string
  text: string
  createdAt: string
  editedAt?: string | null
  parentId?: string | null
  likeCount: number
  isLiked: boolean
  isOwn: boolean
  replies: Omit<ThreadComment, 'replies'>[]
}

interface CommentThreadProps {
  comments: ThreadComment[]
  isLoading?: boolean
  isLoggedIn: boolean
  currentUserId?: string
  ownerUserId?: string
  onPost: (text: string, parentId?: string) => Promise<void>
  onEdit: (commentId: string, text: string) => Promise<void>
  onDelete: (commentId: string) => void
  onLike: (commentId: string) => void
  variant?: 'inline' | 'drawer'
  onClose?: () => void
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function Avatar({ email, size = 32 }: { email: string; size?: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-display font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: 'var(--surface-elevated)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--accent)',
      }}
    >
      {email.charAt(0).toUpperCase()}
    </div>
  )
}

function MiniHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

interface CommentItemProps {
  comment: ThreadComment | Omit<ThreadComment, 'replies'>
  isReply?: boolean
  currentUserId?: string
  ownerUserId?: string
  onEdit: (commentId: string, text: string) => Promise<void>
  onDelete: (commentId: string) => void
  onLike: (commentId: string) => void
  onReply?: (commentId: string, userEmail: string) => void
}

function CommentItem({
  comment,
  isReply = false,
  currentUserId,
  ownerUserId,
  onEdit,
  onDelete,
  onLike,
  onReply,
}: CommentItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const likeRef = useRef<HTMLButtonElement>(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [saving, setSaving] = useState(false)

  const isOwner = currentUserId === ownerUserId && !!ownerUserId
  const canDelete = comment.isOwn || isOwner

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return
    gsap.fromTo(ref.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, clearProps: 'opacity,y' })
  }, [])

  function handleDelete() {
    const el = ref.current
    if (el && !prefersReducedMotion()) {
      gsap.to(el, {
        x: 24,
        opacity: 0,
        height: 0,
        marginBottom: 0,
        duration: DURATION.micro + 0.1,
        ease: EASE.softIn,
        onComplete: () => onDelete(comment.id),
      })
    } else {
      onDelete(comment.id)
    }
  }

  function handleLike() {
    const btn = likeRef.current
    if (btn && !prefersReducedMotion()) {
      gsap.fromTo(btn, { scale: 0.7 }, { scale: 1, duration: DURATION.base, ease: EASE.pop })
    }
    onLike(comment.id)
  }

  async function handleSave() {
    if (!editText.trim() || editText.trim() === comment.text) { setEditing(false); return }
    setSaving(true)
    try {
      await onEdit(comment.id, editText.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={ref}
      className={`flex gap-3 group/item ${isReply ? 'pl-10' : ''}`}
      style={{ willChange: 'transform, opacity' }}
    >
      <Avatar email={comment.userEmail} size={isReply ? 26 : 32} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans text-xs font-medium text-[var(--text)]">
            {comment.userEmail.split('@')[0]}
          </span>
          <span className="font-sans text-[11px] text-[var(--text-muted)]">{timeAgo(comment.createdAt)}</span>
          {comment.editedAt && (
            <span className="font-sans text-[10px] text-[var(--text-muted)] italic">editado</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              maxLength={500}
              autoFocus
              className="w-full bg-[var(--surface)] border border-[var(--accent)]/40 rounded-lg px-3 py-2 font-sans text-sm text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent)]/70 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="font-sans text-xs font-medium text-[var(--accent)] disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditText(comment.text) }}
                className="font-sans text-xs text-[var(--text-muted)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="font-sans text-sm text-[var(--text)] mt-0.5 leading-relaxed break-words">
            {comment.text}
          </p>
        )}

        {/* Actions row */}
        {!editing && (
          <div className="flex items-center gap-3 mt-1.5">
            <button
              ref={likeRef}
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1 font-sans text-xs transition-colors duration-150"
              style={{ color: comment.isLiked ? 'var(--accent)' : 'var(--text-muted)' }}
              aria-label={comment.isLiked ? 'Quitar like' : 'Me gusta'}
            >
              <MiniHeartIcon filled={comment.isLiked} />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>

            {!isReply && onReply && (
              <button
                type="button"
                onClick={() => onReply(comment.id, comment.userEmail)}
                className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150 opacity-0 group-hover/item:opacity-100"
              >
                Responder
              </button>
            )}

            {comment.isOwn && (
              <button
                type="button"
                onClick={() => { setEditing(true); setEditText(comment.text) }}
                className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150 opacity-0 group-hover/item:opacity-100"
              >
                Editar
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="font-sans text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors duration-150 opacity-0 group-hover/item:opacity-100 ml-auto"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ReplyInput({
  replyTo,
  onSubmit,
  onCancel,
}: {
  replyTo: { id: string; email: string }
  onSubmit: (text: string, parentId: string) => Promise<void>
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    try {
      await onSubmit(text.trim(), replyTo.id)
      setText('')
      onCancel()
    } finally {
      setPosting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pl-10 flex flex-col gap-1.5">
      <p className="font-sans text-xs text-[var(--text-muted)]">
        Respondiendo a <span className="text-[var(--accent)]">{replyTo.email.split('@')[0]}</span>
      </p>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Escribe una respuesta..."
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 font-sans text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!text.trim() || posting}
          className="font-sans text-xs font-medium text-[var(--accent)] disabled:opacity-50"
        >
          {posting ? 'Enviando...' : 'Responder'}
        </button>
        <button type="button" onClick={onCancel} className="font-sans text-xs text-[var(--text-muted)]">
          Cancelar
        </button>
      </div>
    </form>
  )
}

const MAX_INITIAL_REPLIES = 2

function RootCommentRow({
  comment,
  currentUserId,
  ownerUserId,
  onEdit,
  onDelete,
  onLike,
  onPost,
}: Pick<CommentThreadProps, 'currentUserId' | 'ownerUserId' | 'onEdit' | 'onDelete' | 'onLike' | 'onPost'> & {
  comment: ThreadComment
}) {
  const [replyTo, setReplyTo] = useState<{ id: string; email: string } | null>(null)
  const [showAllReplies, setShowAllReplies] = useState(false)

  const replies = comment.replies ?? []
  const visibleReplies = showAllReplies ? replies : replies.slice(0, MAX_INITIAL_REPLIES)
  const hiddenCount = replies.length - visibleReplies.length

  return (
    <div className="flex flex-col gap-2">
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        ownerUserId={ownerUserId}
        onEdit={onEdit}
        onDelete={onDelete}
        onLike={onLike}
        onReply={(id, email) => setReplyTo({ id, email })}
      />

      {/* Replies */}
      {visibleReplies.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleReplies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              isReply
              currentUserId={currentUserId}
              ownerUserId={ownerUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
            />
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAllReplies(true)}
          className="pl-10 font-sans text-xs text-[var(--text-muted)] hover:text-[var(--accent)] text-left transition-colors duration-150"
        >
          Ver {hiddenCount} {hiddenCount === 1 ? 'respuesta' : 'respuestas'} mas
        </button>
      )}

      {replyTo && (
        <ReplyInput
          replyTo={replyTo}
          onSubmit={onPost}
          onCancel={() => setReplyTo(null)}
        />
      )}
    </div>
  )
}

export function CommentThread({
  comments,
  isLoading,
  isLoggedIn,
  currentUserId,
  ownerUserId,
  onPost,
  onEdit,
  onDelete,
  onLike,
  variant = 'inline',
  onClose,
}: CommentThreadProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const submitRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (variant !== 'drawer' || !drawerRef.current || prefersReducedMotion()) return
    gsap.from(drawerRef.current, { y: '100%', opacity: 0, duration: DURATION.base + 0.04, ease: EASE.out })
  }, [variant])

  function handleClose() {
    if (variant !== 'drawer' || !drawerRef.current || prefersReducedMotion()) { onClose?.(); return }
    gsap.to(drawerRef.current, { y: '100%', opacity: 0, duration: DURATION.micro + 0.04, ease: EASE.softIn, onComplete: onClose })
  }

  const animateSubmit = useCallback(() => {
    const btn = submitRef.current
    if (!btn || prefersReducedMotion()) return
    gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: DURATION.base, ease: EASE.pop })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    try {
      await onPost(text.trim())
      setText('')
      animateSubmit()
    } finally {
      setPosting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim()) handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const inner = (
    <>
      {/* Header */}
      {variant === 'drawer' ? (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <span className="font-display font-semibold text-[var(--text)] text-sm">
            Comentarios {comments.length > 0 && <span className="font-sans font-normal text-[var(--text-muted)]">({comments.length})</span>}
          </span>
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
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.15rem' }}>
            Comentarios
          </h2>
          {comments.length > 0 && (
            <span className="font-sans text-xs text-[var(--text-muted)]">{comments.length}</span>
          )}
        </div>
      )}

      {/* List */}
      <div className={`flex-1 overflow-y-auto flex flex-col gap-5 min-h-0 ${variant === 'drawer' ? 'px-5 py-4' : ''}`}>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <p className="text-center font-sans text-sm text-[var(--text-muted)] py-8">
            Nadie comento todavia. Se el primero.
          </p>
        )}

        {comments.map((c) => (
          <RootCommentRow
            key={c.id}
            comment={c}
            currentUserId={currentUserId}
            ownerUserId={ownerUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onLike={onLike}
            onPost={onPost}
          />
        ))}
      </div>

      {/* Input */}
      <div className={`flex-shrink-0 border-t border-[var(--border)] ${variant === 'drawer' ? 'px-5 py-4' : 'pt-4'}`}>
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deja un comentario..."
              rows={2}
              maxLength={500}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 font-sans text-base text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors duration-150"
            />
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-[var(--text-muted)]">{text.length}/500</span>
              <button
                ref={submitRef}
                type="submit"
                disabled={!text.trim() || posting}
                className="px-4 py-1.5 rounded-lg font-sans text-sm font-medium disabled:opacity-40 hover:opacity-90 select-none"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  transition: 'opacity 0.14s ease, transform 0.14s cubic-bezier(0.32,0.72,0,1)',
                  willChange: 'transform',
                }}
              >
                {posting ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </form>
        ) : (
          <p className="font-sans text-sm text-[var(--text-muted)] text-center py-1">
            Inicia sesion para comentar.
          </p>
        )}
      </div>
    </>
  )

  if (variant === 'drawer') {
    return (
      <>
        <div className="fixed inset-0 z-[60]" onClick={handleClose} />
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
          {inner}
        </div>
      </>
    )
  }

  return <div className="flex flex-col gap-6">{inner}</div>
}
