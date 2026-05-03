import { sanitizeEmbedHtml } from '../../utils/sanitize.js'
import { cn } from '../../utils/cn.js'
import type { MediaItem } from '../../types/index.js'

interface MediaEmbedProps {
  item: MediaItem
  className?: string
}

export function MediaEmbed({ item, className }: MediaEmbedProps) {
  if (item.platform === 'youtube' && item.embedId) {
    return (
      <div
        className={cn('relative w-full overflow-hidden rounded-md', className)}
        style={{ paddingBottom: '56.25%' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${item.embedId}`}
          title={item.title ?? 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>
    )
  }

  if (item.platform === 'spotify' && item.embedId) {
    return (
      <div className={cn('w-full overflow-hidden rounded-md', className)}>
        <iframe
          src={`https://open.spotify.com/embed/${item.embedId}?theme=0`}
          title={item.title ?? 'Spotify player'}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="w-full"
          height="152"
          loading="lazy"
          style={{ borderRadius: 'var(--radius-md)' }}
        />
      </div>
    )
  }

  if (item.platform === 'soundcloud' && item.embedHtml) {
    const safe = sanitizeEmbedHtml(item.embedHtml)
    return (
      <div
        className={cn('w-full overflow-hidden rounded-md', className)}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    )
  }

  return null
}
