import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useSocialStats, useToggleLike, useToggleAttend } from '../../hooks/useSocial.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { cn } from '../../utils/cn.js'

interface EventSocialBarProps {
  eventId: string
  onCommentClick?: () => void
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CalendarCheckIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={filled ? 'currentColor' : 'none'} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      {filled && <polyline points="9 16 11 18 15 14" stroke={filled ? 'var(--bg)' : 'currentColor'} />}
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function EventSocialBar({ eventId, onCommentClick }: EventSocialBarProps) {
  const { user } = useAuthStore()
  const { data: stats } = useSocialStats(eventId)
  const toggleLike = useToggleLike(eventId)
  const toggleAttend = useToggleAttend(eventId)

  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const heartRef = useRef<HTMLButtonElement>(null)
  const attendRef = useRef<HTMLButtonElement>(null)

  function handleLike() {
    if (!user) return
    if (heartRef.current) {
      gsap.fromTo(
        heartRef.current,
        { scale: 1 },
        { scale: 1.35, duration: 0.12, yoyo: true, repeat: 1, ease: 'expo.out' },
      )
    }
    toggleLike.mutate()
  }

  function handleAttend() {
    if (!user) return
    if (attendRef.current) {
      gsap.fromTo(
        attendRef.current,
        { scale: 1 },
        { scale: 1.2, duration: 0.12, yoyo: true, repeat: 1, ease: 'expo.out' },
      )
    }
    toggleAttend.mutate()
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank', 'noopener')
    setShareOpen(false)
  }

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-share]')) setShareOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const liked = stats?.userLiked ?? false
  const attending = stats?.userAttending ?? false

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Like */}
      <button
        ref={heartRef}
        type="button"
        onClick={handleLike}
        disabled={!user || toggleLike.isPending}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-medium transition-all duration-150',
          liked
            ? 'bg-red-500/15 border-red-500/30 text-red-400'
            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text)]',
          !user && 'opacity-50 cursor-not-allowed',
        )}
        title={user ? (liked ? 'Quitar me gusta' : 'Me gusta') : 'Inicia sesion para dar me gusta'}
      >
        <HeartIcon filled={liked} />
        <span>{stats?.likeCount ?? 0}</span>
      </button>

      {/* Attend */}
      <button
        ref={attendRef}
        type="button"
        onClick={handleAttend}
        disabled={!user || toggleAttend.isPending}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-medium transition-all duration-150',
          attending
            ? 'bg-[var(--accent-muted)] border-[var(--accent)]/30 text-[var(--accent)]'
            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text)]',
          !user && 'opacity-50 cursor-not-allowed',
        )}
        title={user ? (attending ? 'Cancelar asistencia' : 'Voy a ir') : 'Inicia sesion para confirmar asistencia'}
      >
        <CalendarCheckIcon filled={attending} />
        <span>{attending ? 'Voy' : 'Asistir'}</span>
        {(stats?.attendCount ?? 0) > 0 && (
          <span className="text-xs opacity-70">({stats?.attendCount})</span>
        )}
      </button>

      {/* Comments */}
      <button
        type="button"
        onClick={onCommentClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-white/20 font-sans text-sm font-medium transition-all duration-150"
      >
        <CommentIcon />
        <span>{stats?.commentCount ?? 0}</span>
      </button>

      {/* Share */}
      <div className="relative" data-share>
        <button
          type="button"
          onClick={() => setShareOpen(!shareOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-white/20 font-sans text-sm font-medium transition-all duration-150"
        >
          <ShareIcon />
          <span>Compartir</span>
        </button>

        {shareOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl z-20">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full px-4 py-3 text-left font-sans text-sm text-[var(--text)] hover:bg-white/5 transition-colors"
            >
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full px-4 py-3 text-left font-sans text-sm text-[var(--text)] hover:bg-white/5 transition-colors border-t border-[var(--border)]"
            >
              Compartir por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
