import { Event, type IEvent } from '../models/Event.js'
import { Profile } from '../models/Profile.js'
import { toSlug } from '../utils/slug.js'
import { destroyAsset } from './cloudinaryService.js'
import type { CreateEventInput, UpdateEventInput } from '@dj/shared'
import type { FilterQuery, Types } from 'mongoose'

export async function createEvent(userId: string, data: CreateEventInput): Promise<IEvent> {
  const profile = await Profile.findOne({ userId })
  if (!profile) {
    throw Object.assign(new Error('Debes crear un perfil antes de publicar eventos'), {
      status: 403,
    })
  }

  return Event.create({
    profileId: profile._id,
    ...data,
    date: new Date(data.date),
    isVisible: true,
  })
}

export async function updateEvent(
  eventId: string,
  userId: string,
  data: UpdateEventInput,
): Promise<IEvent | null> {
  const profile = await Profile.findOne({ userId })
  if (!profile) throw Object.assign(new Error('Perfil no encontrado'), { status: 404 })

  const event = await Event.findOne({ _id: eventId, profileId: profile._id })
  if (!event) throw Object.assign(new Error('Evento no encontrado o sin permiso'), { status: 404 })

  const update: Record<string, unknown> = { ...data }
  if (data.date) update.date = new Date(data.date)

  return Event.findByIdAndUpdate(eventId, { $set: update }, { new: true, runValidators: true })
}

export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  const profile = await Profile.findOne({ userId })
  if (!profile) throw Object.assign(new Error('Perfil no encontrado'), { status: 404 })

  const event = await Event.findOne({ _id: eventId, profileId: profile._id })
  if (!event) throw Object.assign(new Error('Evento no encontrado o sin permiso'), { status: 404 })

  const assetUrls = [event.cover, ...event.media].filter(Boolean) as string[]
  await Promise.allSettled(assetUrls.map(destroyAsset))

  await Event.deleteOne({ _id: eventId })
}

export async function getEventById(id: string): Promise<IEvent | null> {
  return Event.findOne({ _id: id, isVisible: true }).populate('profileId', 'artistName avatar type whatsapp')
}

export async function listEvents(cursor?: string, limit = 20): Promise<IEvent[]> {
  const query: FilterQuery<IEvent> = { isVisible: true }
  if (cursor) query._id = { $lt: cursor }

  return Event.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate('profileId', 'artistName avatar type whatsapp')
    .lean() as unknown as IEvent[]
}

export async function listEventsByProfile(profileId: string): Promise<IEvent[]> {
  return Event.find({ profileId, isVisible: true }).sort({ date: -1 }).lean() as unknown as IEvent[]
}

export function serializeEvent(e: IEvent) {
  const profileData = e.profileId as unknown as {
    _id: Types.ObjectId
    artistName?: string
    avatar?: string
    type?: string
    whatsapp?: string
  }

  return {
    id: (e._id as Types.ObjectId).toString(),
    slug: toSlug(e.title),
    profileId: typeof e.profileId === 'object' && '_id' in (e.profileId as object)
      ? profileData._id.toString()
      : e.profileId.toString(),
    title: e.title,
    description: e.description,
    date: e.date.toISOString(),
    location: e.location,
    cover: e.cover,
    media: e.media,
    isVisible: e.isVisible,
    likeCount: e.likeCount ?? 0,
    attendCount: e.attendCount ?? 0,
    commentCount: e.commentCount ?? 0,
    createdAt: e.createdAt.toISOString(),
    profile:
      profileData.artistName
        ? {
            id: profileData._id.toString(),
            artistName: profileData.artistName,
            avatar: profileData.avatar,
            type: profileData.type ?? 'dj',
            whatsapp: profileData.whatsapp,
          }
        : undefined,
  }
}
