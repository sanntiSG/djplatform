import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { Event } from '../models/Event.js'
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
