import { apiClient } from './apiClient.js'
import type { SubscribeResult } from '../utils/pushReasons.js'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  const data = await apiClient.get<{ publicKey: string | null }>('/push/vapid-public-key')
  return data.publicKey
}

export async function subscribe(): Promise<SubscribeResult> {
  console.log('[push] subscribe() iniciado')

  if (!('Notification' in window) || !('PushManager' in window)) {
    if (isIOS() && !isStandalone()) {
      console.log('[push] iOS Safari detectado sin modo standalone (PWA no instalada)')
      return { ok: false, reason: 'ios-needs-pwa' }
    }
    console.log('[push] Navegador no soporta push')
    return { ok: false, reason: 'unsupported-browser' }
  }

  const permission = await Notification.requestPermission()
  console.log('[push] Permiso:', permission)
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' }
  }

  const swReg = await getSwRegistration()
  if (!swReg) {
    console.log('[push] Service worker no listo')
    return { ok: false, reason: 'sw-not-ready' }
  }

  let publicKey: string | null
  try {
    publicKey = await getVapidPublicKey()
  } catch (err) {
    console.log('[push] Error obteniendo VAPID key:', err)
    return { ok: false, reason: 'network-error', detail: String(err) }
  }

  if (!publicKey) {
    console.log('[push] VAPID public key es null (no configurada en server)')
    return { ok: false, reason: 'vapid-missing' }
  }

  let sub: PushSubscription
  try {
    sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
    })
    console.log('[push] Suscripcion creada:', sub.endpoint.slice(0, 40) + '...')
  } catch (err) {
    console.log('[push] pushManager.subscribe() fallo:', err)
    return { ok: false, reason: 'subscribe-failed', detail: String(err) }
  }

  const subJson = sub.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  try {
    await apiClient.post('/push/subscribe', {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      userAgent: navigator.userAgent,
    })
    console.log('[push] Suscripcion registrada en servidor')
  } catch (err) {
    console.log('[push] Error registrando suscripcion en servidor:', err)
    return { ok: false, reason: 'network-error', detail: String(err) }
  }

  return { ok: true }
}

export async function unsubscribe(): Promise<void> {
  const swReg = await getSwRegistration()
  if (!swReg) return

  const sub = await swReg.pushManager.getSubscription()
  if (!sub) return

  const endpoint = sub.endpoint
  await sub.unsubscribe()
  await apiClient.post('/push/unsubscribe', { endpoint })
}

export async function dismissAsk(): Promise<void> {
  await apiClient.post('/push/ask-dismissed', {})
}

export async function testPushSelf(): Promise<{ ok: boolean; attempted: number }> {
  return apiClient.post<{ ok: boolean; attempted: number }>('/push/test', {})
}
