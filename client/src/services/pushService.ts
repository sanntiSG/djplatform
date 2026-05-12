import { apiClient } from './apiClient.js'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
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

export async function subscribe(): Promise<boolean> {
  if (!('Notification' in window) || !('PushManager' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const swReg = await getSwRegistration()
  if (!swReg) return false

  const publicKey = await getVapidPublicKey()
  if (!publicKey) return false

  const sub = await swReg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
  })

  const subJson = sub.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  await apiClient.post('/push/subscribe', {
    endpoint: subJson.endpoint,
    keys: subJson.keys,
    userAgent: navigator.userAgent,
  })

  return true
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
