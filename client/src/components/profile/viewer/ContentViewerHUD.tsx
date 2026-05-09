import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useAuthStore } from '../../../store/useAuthStore.js'
import { useToggleContentLike, useProfileContentSocial } from '../../../hooks/useContentSocial.js'
import { useSocialStats, useToggleLike as useToggleEventLike, useToggleAttend } from '../../../hooks/useSocial.js'
import { ContentComments } from './ContentComments.js'
import { LikeButton } from '../../ui/LikeButton.js'
import { useTapAnim } from '../../../hooks/useTapAnim.js'
import type { FeedItem } from '../../../utils/profileFeed.js'
import type { ProfileResponse } from '../../../types/index.js'
import { DURATION, EASE, prefersReducedMotion } from '../../../utils/motion.js'

interface ContentViewerHUDProps {
  item: FeedItem
  profile: ProfileResponse
  onClose: () => void
  onShare: () => void
  profileAccent: string
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d < 7) return `hace ${d}d`
  if (d < 30) return `hace ${Math.floor(d / 7)}sem`
  if (d < 365) return `hace ${Math.floor(d / 30)}m`
  return `hace ${Math.floor(d / 365)}a`
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function AttendIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function HUDButton({
  onClick,
  ariaLabel,
  color,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  color?: string
  children: React.ReactNode
}) {
  const { ref, tapHandlers } = useTapAnim<HTMLButtonElement>(0.9)
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-1 select-none"
      style={{ color: color ?? 'rgba(255,255,255,0.85)' }}
      {...tapHandlers}
    >
      {children}
    </button>
  )
}

// HUD para items de foto/media
function ContentHUDButtons({
  item,
  profile,
  profileAccent,
  onOpenComments,
  onShare,
}: {
  item: FeedItem & { kind: 'photo' | 'media' }
  profile: ProfileResponse
  profileAccent: string
  onOpenComments: () => void
  onShare: () => void
}) {
  const { token } = useAuthStore()
  const { data: socialMap } = useProfileContentSocial(profile.id)
  const key = `${item.kind}:${item.id}`
  const stats = socialMap?.[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }

  const { mutate: toggleLike, isPending: liking } = useToggleContentLike(profile.id, item.kind, item.id)

  return (
    <>
      {token && (
        <LikeButton
          isLiked={stats.isLiked}
          likeCount={stats.likeCount}
          onToggle={() => toggleLike()}
          disabled={liking}
          accentColor={profileAccent}
          size="md"
          layout="column"
        />
      )}
      <HUDButton onClick={onOpenComments} ariaLabel="Ver comentarios">
        <CommentIcon />
        {stats.commentCount > 0 && (
          <span className="font-sans text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {stats.commentCount}
          </span>
        )}
      </HUDButton>
      <HUDButton onClick={onShare} ariaLabel="Compartir">
        <ShareIcon />
      </HUDButton>
    </>
  )
}

// HUD para eventos
function EventHUDButtons({
  eventId,
  profileAccent,
  onShare,
}: {
  eventId: string
  profileAccent: string
  onShare: () => void
}) {
  const { token } = useAuthStore()
  const { data: stats } = useSocialStats(eventId)
  const { mutate: toggleLike } = useToggleEventLike(eventId)
  const { mutate: toggleAttend } = useToggleAttend(eventId)

  const attendRef = useRef<HTMLButtonElement>(null)
  const isAttending = !!stats?.userAttending

  const handleAttend = () => {
    toggleAttend()
    if (attendRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        attendRef.current,
        { scale: 0.88 },
        { scale: 1, duration: DURATION.base, ease: EASE.pop },
      )
    }
  }

  return (
    <>
      {token && (
        <>
          <LikeButton
            isLiked={!!stats?.userLiked}
            likeCount={stats?.likeCount}
            onToggle={() => toggleLike()}
            accentColor={profileAccent}
            size="md"
            layout="column"
          />
          <button
            ref={attendRef}
            type="button"
            onClick={handleAttend}
            aria-label="Asistir al evento"
            className="flex flex-col items-center gap-1 select-none"
            style={{ color: isAttending ? profileAccent : 'rgba(255,255,255,0.85)' }}
          >
            <AttendIcon filled={isAttending} />
            {((stats as { attendCount?: number })?.attendCount ?? 0) > 0 && (
              <span className="font-sans text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {(stats as { attendCount?: number })?.attendCount}
              </span>
            )}
          </button>
        </>
      )}
      <HUDButton onClick={onShare} ariaLabel="Compartir">
        <ShareIcon />
      </HUDButton>
    </>
  )
}

function CloseButton({ onClick, size }: { onClick: () => void; size: 'sm' | 'md' }) {
  const { ref, tapHandlers } = useTapAnim<HTMLButtonElement>(0.88)
  const wh = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'
  const iconSz = size === 'sm' ? 16 : 18
  const sw = size === 'sm' ? '2.2' : '2.5'
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label="Cerrar visor"
      className={`${wh} rounded-full flex items-center justify-center select-none flex-shrink-0`}
      style={{ background: size === 'sm' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.9)' }}
      {...tapHandlers}
    >
      <svg width={iconSz} height={iconSz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

export function ContentViewerHUD({
  item,
  profile,
  onClose,
  onShare,
  profileAccent,
}: ContentViewerHUDProps) {
  const [commentsOpen, setCommentsOpen] = useState(false)

  const isContentItem = item.kind === 'photo' || item.kind === 'media'

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        {profile.avatar && (
          <img
            src={profile.avatar}
            alt={profile.artistName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            style={{ border: '2px solid rgba(255,255,255,0.2)' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate leading-none">
            {profile.artistName}
          </p>
          <p className="font-sans text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {formatRelative(item.addedAt)}
          </p>
        </div>
        <CloseButton onClick={onClose} size="sm" />
      </div>

      {/* Mobile bottom bar */}
      <div
        className="lg:hidden absolute bottom-0 left-0 right-0 z-20 flex items-center justify-around px-6 pb-8 pt-6"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
      >
        {isContentItem ? (
          <ContentHUDButtons
            item={item as FeedItem & { kind: 'photo' | 'media' }}
            profile={profile}
            profileAccent={profileAccent}
            onOpenComments={() => setCommentsOpen(true)}
            onShare={onShare}
          />
        ) : (
          <EventHUDButtons
            eventId={item.id}
            profileAccent={profileAccent}
            onShare={onShare}
          />
        )}
      </div>

      {/* Desktop right sidebar */}
      <div
        className="hidden lg:flex absolute right-0 top-0 bottom-0 z-20 w-20 flex-col items-center py-10 gap-8"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
      >
        <div className="flex flex-col items-center gap-5">
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt={profile.artistName}
              className="w-11 h-11 rounded-full object-cover"
              style={{ border: '2px solid rgba(255,255,255,0.25)' }}
            />
          )}
          <CloseButton onClick={onClose} size="md" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          {isContentItem ? (
            <ContentHUDButtons
              item={item as FeedItem & { kind: 'photo' | 'media' }}
              profile={profile}
              profileAccent={profileAccent}
              onOpenComments={() => setCommentsOpen(true)}
              onShare={onShare}
            />
          ) : (
            <EventHUDButtons
              eventId={item.id}
              profileAccent={profileAccent}
              onShare={onShare}
            />
          )}
        </div>
      </div>

      {commentsOpen && isContentItem && (
        <ContentComments
          profileId={profile.id}
          kind={(item as FeedItem & { kind: 'photo' | 'media' }).kind}
          targetId={item.id}
          ownerUserId={profile.userId}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </>
  )
}
