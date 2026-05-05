import { Profile, type IProfile } from '../models/Profile.js'
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
    })),
    photos: p.photos ?? [],
    priceRange: p.priceRange,
    isVisible: p.isVisible,
    createdAt: p.createdAt.toISOString(),
  }
}
