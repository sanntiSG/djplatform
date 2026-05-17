import { Genre } from '../models/Genre.js'
import { EventType } from '../models/EventType.js'
import { Profile } from '../models/Profile.js'

export async function getGenres() {
  return Genre.find({ isActive: true }).sort({ order: 1 }).lean()
}

export async function getEventTypes() {
  return EventType.find({ isActive: true }).sort({ order: 1 }).lean()
}

export interface GenreWithCount {
  name: string
  slug: string
  count: number
}

export async function getGenresByPopularity(): Promise<GenreWithCount[]> {
  // Aggregate track-level genre tags from all visible profiles
  const agg = await Profile.aggregate<{ _id: string; count: number }>([
    { $match: { isVisible: true } },
    { $unwind: '$media' },
    { $unwind: '$media.genres' },
    { $group: { _id: '$media.genres', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  return agg.map(({ _id, count }) => ({
    name: _id,
    slug: _id.toLowerCase().replace(/\s+/g, '-'),
    count,
  }))
}
