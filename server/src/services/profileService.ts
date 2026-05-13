import { Profile, type IProfile } from '../models/Profile.js'
import { ProfileFollow } from '../models/ProfileFollow.js'
import { User } from '../models/User.js'
import { normalizeWhatsApp } from '../utils/whatsapp.js'
import { toSlug } from '../utils/slug.js'
import type { CreateProfileInput, UpdateProfileInput } from '@dj/shared'
import type { FilterQuery, Types } from 'mongoose'

export async function getProfileByUserId(userId: string): Promise<IProfile | null> {
  return Profile.findOne({ userId })
}

export async function getProfileById(id: string): Promise<IProfile | null> {
  return Profile.findById(id)
}

export async function createProfile(
  userId: string,
  data: CreateProfileInput,
): Promise<IProfile> {
  const existing = await Profile.findOne({ userId })
  if (existing) {
    throw Object.assign(new Error('Ya tenés un perfil creado'), { status: 409 })
  }

  const whatsapp = data.whatsapp ? normalizeWhatsApp(data.whatsapp) : undefined

  const profile = await Profile.create({
    userId,
    ...data,
    whatsapp,
    isVisible: true,
  })

  await User.findByIdAndUpdate(userId, { profileId: profile._id })

  return profile
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<IProfile | null> {
  const update: Partial<UpdateProfileInput & { whatsapp: string }> = { ...data }
  if (data.whatsapp) {
    update.whatsapp = normalizeWhatsApp(data.whatsapp)
  }

  // Map 'id' to '_id' for subdocuments; stamp addedAt on new items
  if (update.media) {
    update.media = update.media.map((m: any) => {
      const { id, ...rest } = m
      const base = id ? { _id: id, ...rest } : rest
      return { addedAt: new Date(), ...base }
    })
  }
  if (update.photos) {
    update.photos = update.photos.map((p: any) => {
      const { id, ...rest } = p
      const base = id ? { _id: id, ...rest } : rest
      return { addedAt: new Date(), ...base }
    })
  }

  return Profile.findOneAndUpdate({ userId }, { $set: update }, { new: true, runValidators: true })
}

export async function listProfiles(filters: {
  type?: string
  location?: string
  genres?: string[]
  eventTypes?: string[]
  availability?: string
  q?: string
  limit?: number
  cursor?: string
}): Promise<IProfile[]> {
  const query: FilterQuery<IProfile> = { isVisible: true }

  if (filters.type) query.type = filters.type
  if (filters.location) query.location = { $regex: filters.location, $options: 'i' }
  if (filters.genres?.length) query.genres = { $in: filters.genres }
  if (filters.eventTypes?.length) query.eventTypes = { $in: filters.eventTypes }
  if (filters.availability) query.availability = filters.availability
  if (filters.q) query.$text = { $search: filters.q }
  if (filters.cursor) query._id = { $lt: filters.cursor }

  return Profile.find(query)
    .sort(filters.q ? { score: { $meta: 'textScore' }, _id: -1 } : { _id: -1 })
    .limit(filters.limit ?? 20)
    .lean() as unknown as IProfile[]
}

export async function getTopProfilesByFollowers(limit = 10): Promise<IProfile[]> {
  // Aggregate to count followers per profile and sort descending
  const results = await ProfileFollow.aggregate([
    { $group: { _id: '$followedId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ])

  if (!results.length) {
    // Fallback: return most recently created visible profiles
    return Profile.find({ isVisible: true }).sort({ _id: -1 }).limit(limit).lean() as unknown as IProfile[]
  }

  const ids = results.map((r: { _id: unknown }) => r._id)
  const profiles = await Profile.find({ _id: { $in: ids }, isVisible: true }).lean() as unknown as IProfile[]

  // Re-sort to match follower order
  return ids
    .map((id: unknown) => profiles.find(p => p._id.toString() === id?.toString()))
    .filter((p): p is IProfile => Boolean(p))
}

export async function updateMediaItem(
  userId: string,
  mediaId: string,
  patch: { title?: string; description?: string; genres?: string[] },
): Promise<{ id: string; title?: string; description: string; genres: string[] }> {
  const profile = await Profile.findOne({ userId })
  if (!profile) throw Object.assign(new Error('Perfil no encontrado'), { status: 404 })

  const media = profile.media.find((m) => (m as unknown as { _id: Types.ObjectId })._id?.toString() === mediaId)
  if (!media) throw Object.assign(new Error('Track no encontrado'), { status: 404 })

  if (patch.title !== undefined) media.title = patch.title
  if (patch.description !== undefined) media.description = patch.description
  if (patch.genres !== undefined) {
    if (patch.genres.length > 3) throw Object.assign(new Error('Max 3 generos por track'), { status: 422 })
    media.genres = patch.genres
  }

  await profile.save()

  return {
    id: mediaId,
    title: media.title,
    description: media.description ?? '',
    genres: media.genres ?? [],
  }
}

export function serializeProfile(p: IProfile) {
  return {
    id: (p._id as Types.ObjectId).toString(),
    slug: toSlug(p.artistName),
    userId: p.userId.toString(),
    type: p.type,
    artistName: p.artistName,
    bio: p.bio,
    avatar: p.avatar,
    coverImage: p.coverImage,
    theme: p.theme ?? 'minimal',
    accentColor: p.accentColor,
    location: p.location,
    locationVerified: p.locationVerified ?? false,
    genres: p.genres,
    eventTypes: p.eventTypes,
    availability: p.availability,
    whatsapp: p.whatsapp,
    media: p.media.map((m) => ({
      id: (m as unknown as { _id: Types.ObjectId })._id?.toString(),
      platform: m.platform,
      url: m.url,
      embedId: m.embedId,
      embedHtml: m.embedHtml,
      type: m.type,
      title: m.title,
      description: m.description ?? '',
      genres: m.genres ?? [],
      addedAt: m.addedAt instanceof Date ? m.addedAt.toISOString() : (m.addedAt ?? p.createdAt.toISOString()),
    })),
    photos: (p.photos ?? []).map((photo: unknown) => {
      if (typeof photo === 'string') {
        return { url: photo, addedAt: p.updatedAt?.toISOString() ?? p.createdAt.toISOString() }
      }
      const ph = photo as { _id?: { toString(): string }; url: string; addedAt?: Date | string; caption?: string }
      const addedAt = ph.addedAt instanceof Date
        ? ph.addedAt.toISOString()
        : (ph.addedAt ?? p.createdAt.toISOString())
      return { id: ph._id?.toString(), url: ph.url, addedAt, caption: ph.caption }
    }),
    priceRange: p.priceRange,
    isVisible: p.isVisible,
    createdAt: p.createdAt.toISOString(),
  }
}
