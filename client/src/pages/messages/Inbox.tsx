import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useConversations } from '../../hooks/useConversations.js'
import { useChatSocket } from '../../hooks/useChatSocket.js'
import { revealStagger, prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function Inbox() {
  const { data: convs, isLoading } = useConversations()
  useChatSocket()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current || isLoading || !convs?.length) return
    const items = listRef.current.querySelectorAll('[data-conv]')
    if (!items.length) return
    const st = revealStagger(items, listRef.current, { y: 12, stagger: 0.04 })
    return () => st.kill()
  }, [isLoading, convs?.length])

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:px-8">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/me" className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              Mi cuenta
            </Link>
            <span className="text-[var(--border)] text-xs">/</span>
            <span className="text-xs font-medium text-[var(--text)]">Mensajes</span>
          </div>
          <h1 className="font-display font-semibold text-3xl text-[var(--text)]">Mensajes</h1>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-[var(--radius-md)] skeleton-shimmer" />
            ))}
          </div>
        )}

        {!isLoading && !convs?.length && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--surface)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-muted)]">No tienes conversaciones aun.<br />Visita un perfil para enviar un mensaje.</p>
          </div>
        )}

        <div ref={listRef} className="flex flex-col gap-1">
          {convs?.map(conv => (
            <Link
              key={conv._id}
              to={`/me/mensajes/${conv._id}`}
              data-conv
              className={cn(
                'flex items-center gap-3 px-4 py-4 rounded-[var(--radius-md)]',
                'hover:bg-[var(--surface)] transition-colors duration-150',
                'group relative',
              )}
            >
              {/* Avatar */}
              <div className="shrink-0 w-11 h-11 rounded-full bg-[var(--surface)] overflow-hidden">
                {conv.otherUser.avatar
                  ? <img src={conv.otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-display font-semibold text-[var(--text-muted)]">
                      {conv.otherUser.artistName.charAt(0).toUpperCase()}
                    </div>
                  )
                }
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn(
                    'font-display font-semibold text-sm truncate',
                    conv.unreadCount > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                  )}>
                    {conv.otherUser.artistName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  conv.unreadCount > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                )}>
                  {conv.lastMessagePreview || 'Sin mensajes'}
                </p>
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <div className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold flex items-center justify-center px-1">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
