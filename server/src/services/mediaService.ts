import { Profile, type IProfile } from '../models/Profile.js'
import { toSlug } from '../utils/slug.js'
import type { Types } from 'mongoose'

interface TrackWithProfile {
  track: {
    id: string
    platform: string
    url: string
    embedId?: string
    embedHtml?: string
    type: string
    title?: string
    description: string
    genres: string[]
    addedAt: string
  }
  profile: {
    id: string
    slug: string
    artistName: string
    avatar?: string
  }
}

export async function tracksByGenre(slug: string, limit = 50): Promise<TrackWithProfile[]> {
  // Create a regex that is accent-insensitive and flexible with separators
  // e.g., 'reggaeton' matches 'Reggaetón', 'deep-house' matches 'Deep House'
  const accentMap: Record<string, string> = {
    a: '[aáàäâ]',
    e: '[eéèëê]',
    i: '[iíìïî]',
    o: '[oóòöô]',
    u: '[uúùüû]',
  }

  const searchPattern = slug
    .split('-')
    .map((part) =>
      part
        .split('')
        .map((char) => accentMap[char] || char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join(''),
    )
    .join('[^a-z0-9]+')

  const regex = new RegExp(`^[^a-z0-9]*${searchPattern}[^a-z0-9]*$`, 'i')

  const results = await Profile.aggregate([
    { $match: { isVisible: true, 'media.genres': regex } },
    { $unwind: '$media' },
    { $match: { 'media.genres': regex } },
    { $sort: { 'media.addedAt': -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        artistName: 1,
        avatar: 1,
        media: 1,
      },
    },
  ])

  return results.map((r) => ({
    track: {
      id: r.media._id?.toString() ?? '',
      platform: r.media.platform,
      url: r.media.url,
      embedId: r.media.embedId,
      embedHtml: r.media.embedHtml,
      type: r.media.type,
      title: r.media.title,
      description: r.media.description ?? '',
      genres: r.media.genres ?? [],
      addedAt: r.media.addedAt instanceof Date ? r.media.addedAt.toISOString() : (r.media.addedAt ?? new Date().toISOString()),
    },
    profile: {
      id: (r._id as Types.ObjectId).toString(),
      slug: toSlug(r.artistName as string),
      artistName: r.artistName as string,
      avatar: r.avatar as string | undefined,
    },
  }))
}
