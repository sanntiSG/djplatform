import type { ProfileResponse, EventResponse, Photo, MediaItem } from '../types/index.js'

export type FeedItem =
  | { kind: 'photo'; id: string; addedAt: Date; data: Photo }
  | { kind: 'media'; id: string; addedAt: Date; data: MediaItem }
  | { kind: 'event'; id: string; addedAt: Date; data: EventResponse }

export function buildFeed(profile: ProfileResponse, events: EventResponse[]): FeedItem[] {
  const items: FeedItem[] = []

  for (const photo of profile.photos ?? []) {
    if (photo.id) {
      items.push({ kind: 'photo', id: photo.id, addedAt: new Date(photo.addedAt), data: photo })
    }
  }
  for (const media of profile.media ?? []) {
    if (media.id) {
      items.push({
        kind: 'media',
        id: media.id,
        addedAt: new Date(media.addedAt ?? profile.createdAt),
        data: media,
      })
    }
  }
  for (const event of events) {
    items.push({ kind: 'event', id: event.id, addedAt: new Date(event.createdAt), data: event })
  }

  return items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
}
