import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useNotificationInbox } from '../../hooks/useNotificationInbox.js'
import { revealStagger, DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'
import type { NotificationItem } from '../../services/notificationsService.js'

const TYPE_ICONS: Record<string, () => JSX.Element> = {
  follow_new: () => <FollowIcon />,
  profile_like: () => <HeartIcon />,
  profile_comment: () => <CommentIcon />,
  content_like: () => <HeartIcon />,
  content_comment: () => <CommentIcon />,
  media_like: () => <MusicIcon />,
  event_new_followed_profile: () => <CalendarIcon />,
  event_new_genre_match: () => <MusicIcon />,
  chat_message_new: () => <MessageIcon />,
  chat_message_reply: () => <MessageIcon />,
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

type Filter = 'all' | 'unread'

export function NotificationInbox() {
  const { data, isLoading, markRead, markAllRead, deleteOne } = useNotificationInbox()
  const listRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const items = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0
  const displayed = filter === 'unread' ? items.filter(n => !n.readAt) : items

  useEffect(() => {
    if (!listRef.current || !items.length) return
    const cards = listRef.current.querySelectorAll('[data-notif]')
    if (!cards.length) return
    const st = revealStagger(cards, listRef.current, { y: 14, stagger: 0.03 })
    return () => st.kill()
  }, [isLoading])

  function handleMarkRead(item: NotificationItem) {
    if (!item.readAt) markRead(item._id)
    if (item.url) window.location.href = item.url
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-[var(--surface)] rounded-full p-1">
          {(['all', 'unread'] as Filter[]).map(f => (
            <FilterTab key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todas' : `Sin leer${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </FilterTab>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-xs font-medium text-[var(--accent)] hover:opacity-75 transition-opacity"
          >
            Marcar todo como leido
          </button>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="flex flex-col gap-2">
        {isLoading && <InboxSkeleton />}

        {!isLoading && displayed.length === 0 && (
          <EmptyState filter={filter} />
        )}

        {displayed.map(item => (
          <NotifCard
            key={item._id}
            item={item}
            onClick={() => handleMarkRead(item)}
            onDelete={() => deleteOne(item._id)}
          />
        ))}
      </div>
    </div>
  )
}

function NotifCard({ item, onClick, onDelete }: {
  item: NotificationItem
  onClick: () => void
  onDelete: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isUnread = !item.readAt
  const Icon = TYPE_ICONS[item.type] ?? (() => <BellIcon />)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    const card = cardRef.current
    if (!card || prefersReducedMotion()) { onDelete(); return }
    gsap.to(card, {
      opacity: 0,
      x: 32,
      height: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: DURATION.base,
      ease: EASE.softIn,
      onComplete: onDelete,
    })
  }

  return (
    <div
      ref={cardRef}
      data-notif
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3 cursor-pointer transition-colors duration-150',
        isUnread ? 'bg-[var(--surface)]' : 'bg-[var(--surface)]/60',
        'hover:bg-[var(--surface-elevated)]',
      )}
      style={{ minHeight: '60px' }}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
      )}

      {/* Avatar / icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center overflow-hidden">
        {item.actorAvatar ? (
          <img src={item.actorAvatar} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-[var(--text-muted)]"><Icon /></span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text)] leading-snug">
          {item.actorName && (
            <span className="font-semibold">{item.actorName} </span>
          )}
          <span className="text-[var(--text-muted)]">{getTypeDescription(item.type)}</span>
        </p>
        {!!item.payload?.text && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{String(item.payload.text)}</p>
        )}
        <p className="text-[11px] text-[var(--text-muted)] mt-1 opacity-70">{relativeTime(item.createdAt)}</p>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Eliminar notificacion"
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/8 transition-all duration-150"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

function getTypeDescription(type: string): string {
  const map: Record<string, string> = {
    follow_new: 'te siguio',
    profile_like: 'le dio me gusta a tu perfil',
    profile_comment: 'comento en tu perfil',
    content_like: 'reacciono a tu contenido',
    content_comment: 'comento en tu evento',
    media_like: 'reacciono a tu musica',
    event_new_followed_profile: 'publico un nuevo evento',
    event_new_genre_match: 'Nuevo evento de tu genero',
    chat_message_new: 'te envio un mensaje',
    chat_message_reply: 'respondio tu mensaje',
  }
  return map[type] ?? 'nueva actividad'
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150',
        active ? 'bg-[var(--surface-elevated)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
      )}
    >
      {children}
    </button>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <span className="text-[var(--text-muted)] opacity-50"><BellIcon size={32} /></span>
      <p className="text-sm text-[var(--text-muted)]">
        {filter === 'unread' ? 'No hay notificaciones sin leer' : 'Aun no hay actividad'}
      </p>
    </div>
  )
}

function InboxSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 w-3/4 rounded skeleton-shimmer" />
            <div className="h-3 w-1/2 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  )
}

// SVG icons
function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
function FollowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function MusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
