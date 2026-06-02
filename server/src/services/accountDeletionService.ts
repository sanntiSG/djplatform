/**
 * accountDeletionService.ts
 *
 * Full cascade deletion of a user account + all associated data.
 * Uses a two-phase approach:
 *   1. Synchronous (fast): delete User + Profile — account is invalidated immediately.
 *   2. Background (async, non-blocking): delete every related document across all
 *      collections and free Cloudinary assets. Errors are logged but never rethrown
 *      to the caller since the account is already gone.
 */
import { Types } from 'mongoose'
import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { Event } from '../models/Event.js'
import { EventLike } from '../models/EventLike.js'
import { EventComment } from '../models/EventComment.js'
import { EventAttendance } from '../models/EventAttendance.js'
import { ProfileLike } from '../models/ProfileLike.js'
import { ProfileComment } from '../models/ProfileComment.js'
import { ProfileFollow } from '../models/ProfileFollow.js'
import { ContentLike } from '../models/ContentLike.js'
import { ContentComment } from '../models/ContentComment.js'
import { SavedMedia } from '../models/SavedMedia.js'
import { Notification } from '../models/Notification.js'
import { PushSubscription } from '../models/PushSubscription.js'
import { Collaboration } from '../models/Collaboration.js'
import { Opportunity } from '../models/Opportunity.js'
import { ActivityEvent } from '../models/ActivityEvent.js'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'
import { destroyAsset } from './cloudinaryService.js'
import { logger } from '../utils/logger.js'

/** Gather all Cloudinary image URLs tied to a profile and its events */
async function collectAssetUrls(profileId: Types.ObjectId): Promise<string[]> {
  const urls: string[] = []

  const profile = await Profile.findById(profileId).lean()
  if (profile) {
    if (profile.avatar) urls.push(profile.avatar)
    if (profile.coverImage) urls.push(profile.coverImage)
    for (const photo of profile.photos ?? []) {
      if (photo.url) urls.push(photo.url)
    }
  }

  const events = await Event.find({ profileId }).select('cover media').lean()
  for (const ev of events) {
    if (ev.cover) urls.push(ev.cover)
    for (const m of ev.media ?? []) {
      if (m) urls.push(m)
    }
  }

  return urls.filter(Boolean)
}

/** Run full background cascade. Errors are swallowed with logging. */
async function runCascade(userId: Types.ObjectId, profileId: Types.ObjectId | null): Promise<void> {
  try {
    // ── Cloudinary assets
    if (profileId) {
      const assetUrls = await collectAssetUrls(profileId)
      if (assetUrls.length > 0) {
        await Promise.allSettled(assetUrls.map(url => destroyAsset(url)))
      }
    }

    // ── Event-level children (likes / comments / attendance for events of this profile)
    if (profileId) {
      const eventIds = await Event.find({ profileId }).distinct('_id')
      if (eventIds.length > 0) {
        await Promise.all([
          EventLike.deleteMany({ eventId: { $in: eventIds } }),
          EventComment.deleteMany({ eventId: { $in: eventIds } }),
          EventAttendance.deleteMany({ eventId: { $in: eventIds } }),
        ])
      }
      await Event.deleteMany({ profileId })
    }

    // ── Profile-level social (likes / comments / follows on this profile)
    if (profileId) {
      await Promise.all([
        ProfileLike.deleteMany({ profileId }),
        ProfileComment.deleteMany({ profileId }),
        ContentLike.deleteMany({ profileId }),
        ContentComment.deleteMany({ profileId }),
        ActivityEvent.deleteMany({ actorProfileId: profileId }),
      ])
    }

    // ── Actions by this user across the platform
    await Promise.all([
      // Likes given
      ProfileLike.deleteMany({ userId }),
      EventLike.deleteMany({ userId }),
      ContentLike.deleteMany({ userId }),
      // Comments authored
      ProfileComment.deleteMany({ userId }),
      EventComment.deleteMany({ userId }),
      ContentComment.deleteMany({ userId }),
      // Library
      ProfileFollow.deleteMany({ followerId: userId }),
      SavedMedia.deleteMany({ userId }),
      // Attendance
      EventAttendance.deleteMany({ userId }),
      // Notifications (received + as actor)
      Notification.deleteMany({ $or: [{ userId }, { actorId: userId }] }),
      // Push subscriptions
      PushSubscription.deleteMany({ userId }),
      // Collaborations
      Collaboration.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
    ])

    // ── Pull userId from likedBy[] arrays in all comment collections
    await Promise.all([
      ProfileComment.updateMany({ likedBy: userId }, { $pull: { likedBy: userId } }),
      EventComment.updateMany({ likedBy: userId }, { $pull: { likedBy: userId } }),
      ContentComment.updateMany({ likedBy: userId }, { $pull: { likedBy: userId } }),
    ])

    // ── Opportunities owned + pull from applicantIds[]
    if (profileId) {
      await Opportunity.deleteMany({ profileId })
    }
    await Opportunity.updateMany(
      { applicantIds: userId },
      { $pull: { applicantIds: userId } },
    )

    // ── Messaging
    const conversations = await Conversation.find({ participants: userId }).distinct('_id')
    if (conversations.length > 0) {
      await Promise.all([
        Message.deleteMany({ conversationId: { $in: conversations } }),
        Conversation.deleteMany({ _id: { $in: conversations } }),
      ])
    }

    logger.info('Account cascade completed', { userId: userId.toString() })
  } catch (err) {
    logger.error('Account cascade partial failure', { userId: userId.toString(), err })
  }
}

/**
 * Delete an account.
 *
 * Phase 1 (synchronous): deletes User + Profile — call completes immediately.
 * Phase 2 (background): runs the full cascade without blocking the HTTP response.
 *
 * Returns once phase 1 is done.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const uid = new Types.ObjectId(userId)

  // Phase 1: invalidate the account
  const user = await User.findByIdAndDelete(uid)
  if (!user) {
    const err = new Error('Usuario no encontrado') as Error & { status: number }
    err.status = 404
    throw err
  }

  const profileId = user.profileId ?? null

  // Delete the core profile document synchronously so profile links are dead immediately
  if (profileId) {
    await Profile.findByIdAndDelete(profileId)
  }

  // Phase 2: fire-and-forget cascade
  setImmediate(() => { void runCascade(uid, profileId ?? null) })
}
