import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { ContentLike } from '../models/ContentLike.js'
import type { TrendingEvent, TrendingSong } from '@dj/shared'

/** Replicates the client-side toSlug for generating event slugs */
function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function getTrendingEvents(limit = 20): Promise<TrendingEvent[]> {
  const events = await Event.find({ isVisible: true })
    .sort({ likeCount: -1 })
    .limit(limit)
    .lean()

  return events.map((e) => ({
    kind: 'event' as const,
    id: String(e._id),
    slug: toSlug(e.title),
    profileId: String(e.profileId),
    title: e.title,
    cover: e.cover,
    location: e.location,
    likeCount: e.likeCount ?? 0,
  }))
}

export async function getTrendingSongs(limit = 20): Promise<TrendingSong[]> {
  const pipeline: mongoose.PipelineStage[] = [
    // Only count likes on media items
    { $match: { targetKind: 'media' } },
    // Group by mediaId to sum total likes across all users
    {
      $group: {
        _id: '$targetId',
        likeCount: { $sum: 1 },
        profileId: { $first: '$profileId' },
      },
    },
    { $sort: { likeCount: -1 as const } },
    { $limit: limit },
    // Resolve the profile that owns the media
    {
      $lookup: {
        from: 'profiles',
        localField: 'profileId',
        foreignField: '_id',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    // Extract the specific media subdocument by its _id
    {
      $addFields: {
        mediaItem: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$profile.media',
                cond: { $eq: ['$$this._id', '$_id'] },
              },
            },
            0,
          ],
        },
      },
    },
    // Drop rows where the media was deleted from the profile
    { $match: { mediaItem: { $ne: null } } },
    {
      $project: {
        _id: 0,
        mediaId: { $toString: '$_id' },
        profileId: { $toString: '$profileId' },
        artistName: '$profile.artistName',
        title: '$mediaItem.title',
        platform: '$mediaItem.platform',
        thumbnailUrl: '$mediaItem.thumbnailUrl',
        embedId: '$mediaItem.embedId',
        type: '$mediaItem.type',
        genres: { $ifNull: ['$mediaItem.genres', []] },
        likeCount: 1,
      },
    },
  ]

  const results = await ContentLike.aggregate<Omit<TrendingSong, 'kind'>>(pipeline)
  return results.map((s) => ({ kind: 'song' as const, ...s }))
}
