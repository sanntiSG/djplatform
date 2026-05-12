import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as notificationService from '../services/notificationService.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'

export async function getTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const types = await notificationService.getTypesForUser(req.user!.id)
    res.json(types)
  } catch (err) {
    next(err)
  }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const prefs = await notificationService.getUserPreferences(req.user!.id)
    if (!prefs) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json(prefs)
  } catch (err) {
    next(err)
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as {
      pushOptIn?: boolean
      notificationLevel?: 'profile' | 'all'
      overrides?: Record<string, boolean>
    }
    const result = await notificationService.updateUserPreferences(req.user!.id, data)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getInbox(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 50)
    const before = req.query.before as string | undefined

    const filter: Record<string, unknown> = { userId: req.user!.id }
    if (before) filter.createdAt = { $lt: new Date(before) }

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean(),
      Notification.countDocuments({ userId: req.user!.id, readAt: null }),
    ])

    const hasMore = items.length > limit
    const pageItems = hasMore ? items.slice(0, limit) : items

    // Populate actor info
    const actorIds = [...new Set(pageItems.filter(n => n.actorId).map(n => n.actorId!.toString()))]
    const profiles = actorIds.length
      ? await Profile.find({ userId: { $in: actorIds } }, { userId: 1, artistName: 1, avatar: 1 }).lean()
      : []
    const profilesByUserId = Object.fromEntries(profiles.map(p => [p.userId.toString(), p]))

    const enriched = pageItems.map(n => ({
      _id: n._id.toString(),
      type: n.type,
      actorId: n.actorId?.toString(),
      actorName: n.actorId ? profilesByUserId[n.actorId.toString()]?.artistName : undefined,
      actorAvatar: n.actorId ? profilesByUserId[n.actorId.toString()]?.avatar : undefined,
      payload: n.payload,
      url: n.url,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }))

    res.json({
      items: enriched,
      unreadCount,
      nextCursor: hasMore ? pageItems[pageItems.length - 1].createdAt.toISOString() : null,
    })
  } catch (err) {
    next(err)
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'ID invalido' })
      return
    }
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!.id },
      { readAt: new Date() },
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany(
      { userId: req.user!.id, readAt: null },
      { readAt: new Date() },
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ error: 'ID invalido' })
      return
    }
    await Notification.deleteOne({ _id: id, userId: req.user!.id })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.id, readAt: null })
    res.json({ count })
  } catch (err) {
    next(err)
  }
}
