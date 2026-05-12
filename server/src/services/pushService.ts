import webpush from 'web-push'
import { env } from '../config/env.js'
import { PushSubscription } from '../models/PushSubscription.js'
import { User } from '../models/User.js'
import { logger } from '../utils/logger.js'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    logger.warn('[push] VAPID keys NOT configured. Push notifications disabled. Run: cd server && npx tsx scripts/generateVapidKeys.ts')
    return
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  vapidConfigured = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

export async function subscribe(
  userId: string,
  data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string },
) {
  await PushSubscription.findOneAndUpdate(
    { endpoint: data.endpoint },
    { userId, ...data },
    { upsert: true, new: true },
  )
  await User.findByIdAndUpdate(userId, { pushOptIn: true, notificationsAsked: true })
}

export async function unsubscribe(userId: string, endpoint: string) {
  await PushSubscription.deleteOne({ userId, endpoint })
  const remaining = await PushSubscription.countDocuments({ userId })
  if (remaining === 0) {
    await User.findByIdAndUpdate(userId, { pushOptIn: false })
  }
}

export async function dismissAsk(userId: string) {
  await User.findByIdAndUpdate(userId, { notificationsAsked: true })
}

export function isVapidConfigured(): boolean {
  ensureVapid()
  return vapidConfigured
}

export async function getPushStatus(): Promise<{
  vapidConfigured: boolean
  vapidPublicKeyFingerprint: string
  subscriptionsCount: number
}> {
  ensureVapid()
  const subscriptionsCount = await PushSubscription.countDocuments()
  return {
    vapidConfigured,
    vapidPublicKeyFingerprint: env.VAPID_PUBLIC_KEY ? env.VAPID_PUBLIC_KEY.slice(0, 16) + '...' : '(no configurada)',
    subscriptionsCount,
  }
}

export async function sendTestPush(userId: string): Promise<{ attempted: number }> {
  const subs = await PushSubscription.find({ userId })
  if (!subs.length) return { attempted: 0 }
  await sendPush(userId, {
    title: 'REsonar',
    body: 'Tu sistema de notificaciones funciona correctamente.',
    url: '/me/notificaciones',
  })
  return { attempted: subs.length }
}

export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  ensureVapid()
  if (!vapidConfigured) return

  const subs = await PushSubscription.find({ userId })
  if (!subs.length) return

  const body = JSON.stringify(payload)
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        body,
      ),
    ),
  )

  // Remove stale subscriptions (410 Gone)
  const stale: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        stale.push(subs[i].endpoint)
      } else {
        logger.warn('Push send failed', { endpoint: subs[i].endpoint, err: result.reason })
      }
    }
  })

  if (stale.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: stale } })
  }
}
