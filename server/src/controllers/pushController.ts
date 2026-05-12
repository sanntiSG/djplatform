import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import * as pushService from '../services/pushService.js'

export async function getVapidPublicKey(_req: Request, res: Response) {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null })
}

export async function subscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    const { endpoint, keys, userAgent } = req.body as {
      endpoint: string
      keys: { p256dh: string; auth: string }
      userAgent?: string
    }

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Datos de suscripcion incompletos' })
      return
    }

    await pushService.subscribe(req.user!.id, { endpoint, keys, userAgent })
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function unsubscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    const { endpoint } = req.body as { endpoint: string }
    if (!endpoint) {
      res.status(400).json({ error: 'endpoint requerido' })
      return
    }
    await pushService.unsubscribe(req.user!.id, endpoint)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function dismissAsk(req: Request, res: Response, next: NextFunction) {
  try {
    await pushService.dismissAsk(req.user!.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
