import type { Request, Response, NextFunction } from 'express'
import { NotificationType } from '../models/NotificationType.js'
import * as pushService from '../services/pushService.js'

export async function listNotificationTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const types = await NotificationType.find().sort({ category: 1, key: 1 }).lean()
    const total = types.length
    const active = types.filter(t => t.enabledByAdmin).length
    res.json({ types, stats: { total, active, inactive: total - active } })
  } catch (err) {
    next(err)
  }
}

export async function updateNotificationType(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params
    const { enabledByAdmin } = req.body as { enabledByAdmin: boolean }

    if (typeof enabledByAdmin !== 'boolean') {
      res.status(400).json({ error: 'enabledByAdmin debe ser boolean' })
      return
    }

    const type = await NotificationType.findOneAndUpdate(
      { key },
      { enabledByAdmin },
      { new: true },
    )

    if (!type) {
      res.status(404).json({ error: 'Tipo de notificacion no encontrado' })
      return
    }

    res.json(type)
  } catch (err) {
    next(err)
  }
}

export async function bulkUpdateNotificationTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const { enabledByAdmin } = req.body as { enabledByAdmin: boolean }

    if (typeof enabledByAdmin !== 'boolean') {
      res.status(400).json({ error: 'enabledByAdmin debe ser boolean' })
      return
    }

    await NotificationType.updateMany({}, { enabledByAdmin })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getPushStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = await pushService.getPushStatus()
    res.json(status)
  } catch (err) {
    next(err)
  }
}

export async function testPushAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body as { userId?: string }
    const targetId = userId ?? req.user!.id
    const result = await pushService.sendTestPush(targetId)
    res.json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
}
