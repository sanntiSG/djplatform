import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { Event } from '../models/Event.js'
import { Genre, type IGenre } from '../models/Genre.js'
import { serializeProfile } from './profileService.js'
import { serializeEvent } from './eventService.js'
import { destroyAsset } from './cloudinaryService.js'
import type { IProfile } from '../models/Profile.js'
import type { IEvent } from '../models/Event.js'
import type { FilterQuery, Types } from 'mongoose'

export async function getStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalProfiles,
    activeProfiles,
    totalEvents,
    activeEvents,
    newUsersThisMonth,
    newUsersThisWeek,
  ] = await Promise.all([
    User.countDocuments(),
    Profile.countDocuments(),
    Profile.countDocuments({ isVisible: true }),
    Event.countDocuments(),
    Event.countDocuments({ isVisible: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
  ])

  return {
    totalUsers,
    totalProfiles,
    activeProfiles,
    totalEvents,
    activeEvents,
    newUsersThisMonth,
    newUsersThisWeek,
  }
}

export async function adminListProfiles(filters: {
  visible?: 'all' | 'true' | 'false'
  cursor?: string
  limit?: number
}) {
  const query: FilterQuery<IProfile> = {}
  if (filters.visible === 'true') query.isVisible = true
  else if (filters.visible === 'false') query.isVisible = false
  if (filters.cursor) query._id = { $lt: filters.cursor }

  const profiles = await Profile.find(query)
    .sort({ _id: -1 })
    .limit(filters.limit ?? 30)
    .lean() as unknown as IProfile[]

  return profiles.map(serializeProfile)
}

export async function adminSetProfileVisibility(profileId: string, isVisible: boolean) {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { $set: { isVisible } },
    { new: true },
  )
  if (!profile) throw Object.assign(new Error('Perfil no encontrado'), { status: 404 })
  return serializeProfile(profile)
}

export async function adminDeleteProfile(profileId: string) {
  const result = await Profile.findByIdAndDelete(profileId)
  if (!result) throw Object.assign(new Error('Perfil no encontrado'), { status: 404 })

  await User.findByIdAndUpdate(result.userId, { $unset: { profileId: 1 } })

  // Borrar assets del perfil de Cloudinary
  const profileAssets = [result.avatar, ...result.media.map((m) => m.url)].filter(Boolean) as string[]
  await Promise.allSettled(profileAssets.map(destroyAsset))

  // Borrar eventos y sus assets
  const events = await Event.find({ profileId }).lean()
  const eventAssets = events.flatMap((e) => [e.cover, ...e.media].filter(Boolean)) as string[]
  await Promise.allSettled(eventAssets.map(destroyAsset))
  await Event.deleteMany({ profileId })
}

export async function adminListEvents(filters: {
  visible?: 'all' | 'true' | 'false'
  cursor?: string
  limit?: number
}) {
  const query: FilterQuery<IEvent> = {}
  if (filters.visible === 'true') query.isVisible = true
  else if (filters.visible === 'false') query.isVisible = false
  if (filters.cursor) query._id = { $lt: filters.cursor }

  const events = await Event.find(query)
    .sort({ _id: -1 })
    .limit(filters.limit ?? 30)
    .populate('profileId', 'artistName avatar type')
    .lean() as unknown as IEvent[]

  return events.map(serializeEvent)
}

export async function adminSetEventVisibility(eventId: string, isVisible: boolean) {
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: { isVisible } },
    { new: true },
  ).populate('profileId', 'artistName avatar type')
  if (!event) throw Object.assign(new Error('Evento no encontrado'), { status: 404 })
  return serializeEvent(event as unknown as IEvent)
}

export async function adminDeleteEvent(eventId: string) {
  const result = await Event.findByIdAndDelete(eventId)
  if (!result) throw Object.assign(new Error('Evento no encontrado'), { status: 404 })
  const assets = [result.cover, ...result.media].filter(Boolean) as string[]
  await Promise.allSettled(assets.map(destroyAsset))
}

export async function adminListUsers(filters: { cursor?: string; limit?: number }) {
  const query: FilterQuery<typeof User> = {}
  if (filters.cursor) query._id = { $lt: filters.cursor }

  return User.find(query)
    .select('-password')
    .sort({ _id: -1 })
    .limit(filters.limit ?? 30)
    .lean()
}

function serializeGenre(g: IGenre) {
  return {
    id: (g._id as unknown as { toString(): string }).toString(),
    name: g.name,
    slug: g.slug,
    isActive: g.isActive,
    order: g.order,
  }
}

export async function adminListGenres() {
  const genres = await Genre.find().sort({ order: 1, name: 1 }).lean() as unknown as IGenre[]
  return genres.map(serializeGenre)
}

export async function adminCreateGenre(name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const existing = await Genre.findOne({ slug })
  if (existing) throw Object.assign(new Error('Ya existe un genero con ese nombre'), { status: 409 })

  const maxOrder = await Genre.findOne().sort({ order: -1 }).lean() as unknown as IGenre | null
  const genre = await Genre.create({ name: name.trim(), slug, isActive: true, order: (maxOrder?.order ?? 0) + 1 })
  return serializeGenre(genre as unknown as IGenre)
}

export async function adminUpdateGenre(id: string, patch: { isActive?: boolean; name?: string }) {
  const update: Partial<{ isActive: boolean; name: string; slug: string }> = {}
  if (patch.isActive !== undefined) update.isActive = patch.isActive
  if (patch.name !== undefined) {
    update.name = patch.name.trim()
    update.slug = patch.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const genre = await Genre.findByIdAndUpdate(id, { $set: update }, { new: true })
  if (!genre) throw Object.assign(new Error('Genero no encontrado'), { status: 404 })
  return serializeGenre(genre as unknown as IGenre)
}

export async function adminDeleteGenre(id: string) {
  const genre = await Genre.findById(id).lean() as unknown as IGenre | null
  if (!genre) throw Object.assign(new Error('Genero no encontrado'), { status: 404 })

  const inUseCount = await Profile.countDocuments({
    $or: [{ genres: genre.slug }, { 'media.genres': genre.slug }, { genres: genre.name }, { 'media.genres': genre.name }],
  })
  if (inUseCount > 0) {
    throw Object.assign(new Error('Este genero esta en uso por perfiles o tracks y no puede borrarse'), { status: 409 })
  }

  await Genre.findByIdAndDelete(id)
}
