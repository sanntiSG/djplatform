import { Link } from 'react-router-dom'
import { eventPath } from '../../../utils/slug.js'
import { CaptionEditor } from './CaptionEditor.js'
import type { FeedItem } from '../../../utils/profileFeed.js'
import type { ProfileResponse } from '../../../types/index.js'
import { THEMES } from '../ThemeSelector.js'

interface ContentViewerItemProps {
  item: FeedItem
  profile: ProfileResponse
  isActive: boolean
  isNear: boolean
  isOwner?: boolean
  profileQueryKey?: string
}

function formatDate(d: Date) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function YoutubeEmbed({ embedId, title }: { embedId: string; title?: string }) {
  return (
    <div className="w-full max-w-3xl mx-auto" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${embedId}?autoplay=0&rel=0`}
        title={title ?? 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-2xl"
        style={{ border: 'none' }}
      />
    </div>
  )
}

function SpotifyEmbed({ embedId, title }: { embedId: string; title?: string }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <iframe
        src={`https://open.spotify.com/embed/track/${embedId}?utm_source=generator&theme=0`}
        title={title ?? 'Spotify'}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="w-full rounded-2xl"
        style={{ height: 352, border: 'none' }}
      />
    </div>
  )
}

function SoundCloudEmbed({ embedHtml }: { embedHtml: string }) {
  return (
    <div
      className="w-full max-w-xl mx-auto rounded-2xl overflow-hidden"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  )
}

function MediaPlaceholder({
  item,
}: {
  item: { platform: string; title?: string; embedId?: string }
}) {
  const isYoutube = item.platform === 'youtube'
  if (isYoutube && item.embedId) {
    return (
      <img
        src={`https://i.ytimg.com/vi/${item.embedId}/hqdefault.jpg`}
        alt={item.title ?? 'Video'}
        className="w-full max-w-3xl mx-auto rounded-2xl object-cover"
        style={{ aspectRatio: '16/9' }}
      />
    )
  }
  const color = item.platform === 'spotify' ? '#1ed760' : '#ff5500'
  return (
    <div
      className="w-full max-w-xl mx-auto rounded-2xl flex flex-col items-center justify-center gap-3 p-10"
      style={{ background: `linear-gradient(135deg, #111, ${color}22)`, minHeight: 200 }}
    >
      <span className="font-sans text-xs uppercase tracking-widest" style={{ color }}>
        {item.platform === 'spotify' ? 'Spotify' : 'SoundCloud'}
      </span>
      {item.title && (
        <p className="font-display font-semibold text-white text-center text-lg">{item.title}</p>
      )}
    </div>
  )
}

export function ContentViewerItem({
  item,
  profile,
  isActive,
  isNear,
  isOwner,
  profileQueryKey,
}: ContentViewerItemProps) {
  const themeConfig = THEMES.find((t) => t.id === (profile.theme ?? 'minimal')) ?? THEMES[0]

  if (item.kind === 'photo') {
    return (
      <div
        className="w-full h-full relative flex items-center justify-center"
        style={{ background: themeConfig.gradient }}
      >
        <img
          src={item.data.url}
          alt="Foto"
          loading={isNear ? 'eager' : 'lazy'}
          decoding="async"
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: '90svh' }}
        />
        {(item.data.caption || isOwner) && profileQueryKey && (
          <CaptionEditor
            photoId={item.id}
            caption={item.data.caption}
            isOwner={!!isOwner}
            profileQueryKey={profileQueryKey}
          />
        )}
      </div>
    )
  }

  if (item.kind === 'media') {
    const { data } = item
    const shouldMount = isActive || isNear

    return (
      <div
        className="w-full h-full flex items-center justify-center px-4 sm:px-8"
        style={{ background: 'var(--bg)' }}
      >
        {shouldMount ? (
          <>
            {data.platform === 'youtube' && data.embedId && (
              <YoutubeEmbed embedId={data.embedId} title={data.title} />
            )}
            {data.platform === 'spotify' && data.embedId && (
              <SpotifyEmbed embedId={data.embedId} title={data.title} />
            )}
            {data.platform === 'soundcloud' && data.embedHtml && (
              <SoundCloudEmbed embedHtml={data.embedHtml} />
            )}
            {!data.embedId && !data.embedHtml && (
              <MediaPlaceholder item={data} />
            )}
          </>
        ) : (
          <MediaPlaceholder item={data} />
        )}
      </div>
    )
  }

  // event
  const event = item.data
  const date = new Date(event.date)

  return (
    <div className="w-full h-full flex items-end relative overflow-hidden">
      {event.cover ? (
        <img
          src={event.cover}
          alt={event.title}
          loading={isNear ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.55)' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: themeConfig.gradient }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-8 pb-28 lg:pb-16 flex flex-col gap-3">
        <h2
          className="font-display font-semibold text-white"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
        >
          {event.title}
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="font-sans text-sm text-white/70">{formatDate(date)}</span>
          {event.location && (
            <>
              <span className="text-white/30">·</span>
              <span className="font-sans text-sm text-white/70">{event.location}</span>
            </>
          )}
        </div>
        {event.description && (
          <p className="font-sans text-sm text-white/60 leading-relaxed line-clamp-3">
            {event.description}
          </p>
        )}
        <Link
          to={eventPath(event.slug ?? event.id, event.id)}
          className="self-start font-sans text-sm font-medium px-5 py-2.5 rounded-full border transition-colors duration-150 mt-1"
          style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}
        >
          Ver evento completo
        </Link>
      </div>
    </div>
  )
}
