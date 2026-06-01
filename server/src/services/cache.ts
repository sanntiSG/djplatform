/**
 * Servicio de cache en memoria (LRU) con interfaz abstracta.
 *
 * Hoy: implementado con lru-cache (in-process, zero-dependency).
 * Futuro: para escalar horizontalmente (multi-instancia), reemplazar la implementacion
 * interna de LruCache por una que use Redis (ioredis / upstash-redis) sin tocar los
 * call sites — la interfaz permanece igual.
 *
 * Interface publica:
 *   cache.get<T>(key)                          → T | undefined
 *   cache.set(key, value, ttlMs?)             → void
 *   cache.del(key | key[])                    → void
 *   cache.wrap<T>(key, ttlMs, fn)             → Promise<T>  (stale-while-revalidate simple)
 */

import { LRUCache } from 'lru-cache'

// Tamano maximo del cache en cantidad de items.
// Con ~10k usuarios activos esto es mas que suficiente;
// ajustar maxSize si la instancia tiene poca RAM (256MB en Render free).
const MAX_ITEMS = 2000

// TTL por defecto: 60 segundos
const DEFAULT_TTL_MS = 60_000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lru = new LRUCache<string, any>({
  max: MAX_ITEMS,
  ttl: DEFAULT_TTL_MS,
  allowStale: false,
})

export const cache = {
  get<T>(key: string): T | undefined {
    return lru.get(key) as T | undefined
  },

  set(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
    lru.set(key, value, { ttl: ttlMs })
  },

  del(key: string | string[]): void {
    if (Array.isArray(key)) {
      key.forEach((k) => lru.delete(k))
    } else {
      lru.delete(key)
    }
  },

  /**
   * Si el key existe en cache lo devuelve; si no, ejecuta fn, cachea el resultado y lo retorna.
   * Es el patron "cache-aside" o "read-through" simplificado.
   */
  async wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const cached = lru.get(key)
    if (cached !== undefined) return cached as T
    const result = await fn()
    lru.set(key, result, { ttl: ttlMs })
    return result
  },

  /** Devuelve stats utiles para logs/monitoring */
  stats() {
    return { size: lru.size, max: MAX_ITEMS }
  },
}
