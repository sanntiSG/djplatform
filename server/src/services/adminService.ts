import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { Event } from '../models/Event.js'
import { Genre, type IGenre } from '../models/Genre.js'
import { ProfileType, type IProfileType } from '../models/ProfileType.js'
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

// ── Profile Types ─────────────────────────────────────────────────────────

function serializeProfileType(t: IProfileType) {
  return {
    id: (t._id as unknown as { toString(): string }).toString(),
    name: t.name,
    slug: t.slug,
    isActive: t.isActive,
    isProtected: t.isProtected,
    order: t.order,
  }
}

export async function publicListProfileTypes() {
  const types = await ProfileType.find({ isActive: true }).sort({ order: 1, name: 1 }).lean() as unknown as IProfileType[]
  return types.map((t) => ({ id: (t._id as unknown as { toString(): string }).toString(), name: t.name, slug: t.slug }))
}

export async function adminListProfileTypes() {
  const types = await ProfileType.find().sort({ order: 1, name: 1 }).lean() as unknown as IProfileType[]
  return types.map(serializeProfileType)
}

export async function adminCreateProfileType(name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const existing = await ProfileType.findOne({ slug })
  if (existing) throw Object.assign(new Error('Ya existe un tipo con ese nombre'), { status: 409 })

  const maxOrder = await ProfileType.findOne().sort({ order: -1 }).lean() as unknown as IProfileType | null
  const pt = await ProfileType.create({ name: name.trim(), slug, isActive: true, isProtected: false, order: (maxOrder?.order ?? 0) + 1 })
  return serializeProfileType(pt as unknown as IProfileType)
}

export async function adminUpdateProfileType(id: string, patch: { isActive?: boolean; name?: string }) {
  const existing = await ProfileType.findById(id) as IProfileType | null
  if (!existing) throw Object.assign(new Error('Tipo no encontrado'), { status: 404 })

  const update: Partial<{ isActive: boolean; name: string; slug: string }> = {}
  if (patch.isActive !== undefined) update.isActive = patch.isActive
  if (patch.name !== undefined) {
    update.name = patch.name.trim()
    update.slug = patch.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const updated = await ProfileType.findByIdAndUpdate(id, { $set: update }, { new: true })
  return serializeProfileType(updated as unknown as IProfileType)
}

export async function adminDeleteProfileType(id: string) {
  const pt = await ProfileType.findById(id) as IProfileType | null
  if (!pt) throw Object.assign(new Error('Tipo no encontrado'), { status: 404 })
  if (pt.isProtected) throw Object.assign(new Error('Los tipos base no pueden eliminarse'), { status: 403 })

  const inUse = await Profile.countDocuments({ type: pt.slug })
  if (inUse > 0) throw Object.assign(new Error('Este tipo esta en uso por perfiles activos'), { status: 409 })

  await ProfileType.findByIdAndDelete(id)
}

// ── DB Storage Stats ──────────────────────────────────────────────────────

export interface CollectionStat {
  name: string
  count: number
  sizeMb: number
  indexSizeMb: number
}

export interface DbStatsResult {
  totalDataMb: number
  totalStorageMb: number
  totalIndexMb: number
  collections: CollectionStat[]
  recommendations: string[]
}

export async function getDbStats(): Promise<DbStatsResult> {
  const db = mongoose.connection.db
  if (!db) throw Object.assign(new Error('DB no conectada'), { status: 503 })

  // Global stats
  const globalStats = (await db.stats()) as {
    dataSize?: number
    storageSize?: number
    indexSize?: number
  }

  // Per-collection stats via collStats command
  const collectionInfos = await db.listCollections().toArray()
  const collectionStats: CollectionStat[] = []

  for (const info of collectionInfos) {
    try {
      const stats = (await db.command({ collStats: info.name })) as {
        count?: number
        size?: number
        indexSizes?: Record<string, number>
      }
      const indexSizeBytes = Object.values(stats.indexSizes ?? {}).reduce((a, b) => a + b, 0)
      collectionStats.push({
        name: info.name,
        count: stats.count ?? 0,
        sizeMb: Math.round(((stats.size ?? 0) / 1024 / 1024) * 100) / 100,
        indexSizeMb: Math.round((indexSizeBytes / 1024 / 1024) * 100) / 100,
      })
    } catch {
      // collection may be empty/capped — skip
    }
  }

  collectionStats.sort((a, b) => b.sizeMb - a.sizeMb)

  // Recommendations
  const recommendations: string[] = []

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const inactiveProfiles = await Profile.countDocuments({
    isVisible: false,
    createdAt: { $lt: sixMonthsAgo },
  })
  if (inactiveProfiles > 0) {
    recommendations.push(`${inactiveProfiles} perfil(es) oculto(s) sin actividad en 6 meses`)
  }

  const moderationCacheCollection = collectionStats.find((c) => c.name.toLowerCase().includes('moderationcache'))
  if (moderationCacheCollection && moderationCacheCollection.sizeMb > 10) {
    recommendations.push(`Cache de moderacion usa ${moderationCacheCollection.sizeMb} MB — considera limpiar entradas antiguas`)
  }

  return {
    totalDataMb: Math.round(((globalStats.dataSize ?? 0) / 1024 / 1024) * 100) / 100,
    totalStorageMb: Math.round(((globalStats.storageSize ?? 0) / 1024 / 1024) * 100) / 100,
    totalIndexMb: Math.round(((globalStats.indexSize ?? 0) / 1024 / 1024) * 100) / 100,
    collections: collectionStats,
    recommendations,
  }
}

export async function cleanupInactiveProfiles(): Promise<{ deleted: number }> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const profiles = await Profile.find({ isVisible: false, createdAt: { $lt: sixMonthsAgo } }).lean()

  let deleted = 0
  for (const p of profiles) {
    try {
      await adminDeleteProfile((p._id as { toString(): string }).toString())
      deleted++
    } catch {
      // skip — may have issues
    }
  }
  return { deleted }
}
