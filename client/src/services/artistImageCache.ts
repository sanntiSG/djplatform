const CACHE_KEY = 'puzzle-image-pool-v1'
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface PoolImage {
  name: string
  imageUrl: string
  source: 'deezer' | 'spotify'
}

interface CachedPool {
  version: 1
  fetchedAt: number
  ttlMs: number
  images: PoolImage[]
}

export function getPool(): PoolImage[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data: CachedPool = JSON.parse(raw)
    if (data.version !== 1) return null
    if (Date.now() - data.fetchedAt > data.ttlMs) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data.images
  } catch {
    return null
  }
}

export function savePool(images: PoolImage[], ttlMs = DEFAULT_TTL_MS): void {
  try {
    const data: CachedPool = { version: 1, fetchedAt: Date.now(), ttlMs, images }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function clearPool(): void {
  localStorage.removeItem(CACHE_KEY)
}
