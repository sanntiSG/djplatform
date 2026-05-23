import { useCallback, useEffect, useRef, useState } from 'react'
import { getPool, savePool, type PoolImage } from '../services/artistImageCache'
import { apiClient } from '../services/apiClient'

// Local SVG bootstrap images — always available offline
const BOOTSTRAP_IMAGES: PoolImage[] = [
  { name: 'RE / Sonar', imageUrl: new URL('../assets/puzzle/bootstrap/b1.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Beats', imageUrl: new URL('../assets/puzzle/bootstrap/b2.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Freq', imageUrl: new URL('../assets/puzzle/bootstrap/b3.svg', import.meta.url).href, source: 'deezer' },
  { name: 'BPM Culture', imageUrl: new URL('../assets/puzzle/bootstrap/b4.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Waveform', imageUrl: new URL('../assets/puzzle/bootstrap/b5.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Groove', imageUrl: new URL('../assets/puzzle/bootstrap/b6.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Levels', imageUrl: new URL('../assets/puzzle/bootstrap/b7.svg', import.meta.url).href, source: 'deezer' },
  { name: 'DJ', imageUrl: new URL('../assets/puzzle/bootstrap/b8.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Scene', imageUrl: new URL('../assets/puzzle/bootstrap/b9.svg', import.meta.url).href, source: 'deezer' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function usePuzzleImages() {
  const [pool, setPool] = useState<PoolImage[]>(() => {
    const cached = getPool()
    return cached && cached.length >= 9 ? shuffle(cached) : shuffle(BOOTSTRAP_IMAGES)
  })
  const indexRef = useRef(0)
  const fetchedRef = useRef(false)

  // Background fetch — non-blocking, updates pool when server responds
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const cached = getPool()
    if (cached && cached.length >= 9) return // Fresh cache, no need to refetch

    apiClient
      .get<{ images: PoolImage[]; ttlSeconds: number }>('/artist-images')
      .then(({ images, ttlSeconds }) => {
        if (images.length >= 9) {
          savePool(images, ttlSeconds * 1000)
          setPool(shuffle(images))
          indexRef.current = 0
        }
      })
      .catch(() => {
        // Silently fall back to bootstrap — already in state
      })
  }, [])

  const currentImage = pool[indexRef.current % pool.length]

  const nextImage = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % pool.length
    return pool[indexRef.current]
  }, [pool])

  return { currentImage, nextImage, pool }
}
