import { useCallback, useEffect, useRef, useState } from 'react'
import { getPool, savePool, type PoolImage } from '../services/artistImageCache'
import { apiClient } from '../services/apiClient'
import { cloudinaryUrl } from '../utils/cloudinaryUrl'

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

// Extended local placeholders — used when Spotify/Deezer cache is unavailable
const LOCAL_IMAGES: PoolImage[] = [
  { name: 'Night Gradient 1', imageUrl: new URL('../assets/puzzle/local/local-01.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Night Gradient 2', imageUrl: new URL('../assets/puzzle/local/local-02.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Night Gradient 3', imageUrl: new URL('../assets/puzzle/local/local-03.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Night Gradient 4', imageUrl: new URL('../assets/puzzle/local/local-04.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Waveform Art', imageUrl: new URL('../assets/puzzle/local/local-05.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Resonance', imageUrl: new URL('../assets/puzzle/local/local-06.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Dot Grid', imageUrl: new URL('../assets/puzzle/local/local-07.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Cross Pattern', imageUrl: new URL('../assets/puzzle/local/local-08.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Track 01', imageUrl: new URL('../assets/puzzle/local/local-09.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Track 02', imageUrl: new URL('../assets/puzzle/local/local-10.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Track 03', imageUrl: new URL('../assets/puzzle/local/local-11.svg', import.meta.url).href, source: 'deezer' },
  { name: 'Track 04', imageUrl: new URL('../assets/puzzle/local/local-12.svg', import.meta.url).href, source: 'deezer' },
]

// Full offline pool: 9 bootstrap + 12 local = 21 images
const FALLBACK_POOL: PoolImage[] = [...BOOTSTRAP_IMAGES, ...LOCAL_IMAGES]

// Puzzle piece size upper bound (144 * 3 = 432px). 480px gives a bit of headroom.
const PUZZLE_IMAGE_PX = 480

/**
 * Normalise a PoolImage's imageUrl:
 * - User avatars (Cloudinary) → downscale to 480×480 with face crop + auto format.
 *   This cuts file size 5–10× and prevents first-decode jank on the main thread.
 * - Deezer / Spotify / SVG → returned unchanged (not Cloudinary or already sized).
 */
function optimiseUrl(img: PoolImage): PoolImage {
  if (img.source !== 'user') return img
  const optimised = cloudinaryUrl(img.imageUrl, {
    w: PUZZLE_IMAGE_PX,
    h: PUZZLE_IMAGE_PX,
    fit: 'fill',
    gravity: 'face',
    q: 'auto',
    f: 'auto',
  })
  return optimised === img.imageUrl ? img : { ...img, imageUrl: optimised }
}

function optimisePool(images: PoolImage[]): PoolImage[] {
  return images.map(optimiseUrl)
}

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
    // Cached pools are already optimised (saved post-optimisation below)
    return cached && cached.length >= 9 ? shuffle(cached) : shuffle(FALLBACK_POOL)
  })

  // Tracks recently served image URLs to avoid immediate repetition
  const recentRef = useRef<string[]>([])
  const fetchedRef = useRef(false)
  // Tracks URLs already preloaded so we don't repeat decode work
  const preloadedRef = useRef<Set<string>>(new Set())

  // Seed the first pool image into recent on mount / pool change
  useEffect(() => {
    if (pool.length > 0 && recentRef.current.length === 0) {
      recentRef.current = [pool[0].imageUrl]
    }
  }, [pool])

  // Background preload + decode for every image in the pool.
  // Uses Image.decode() to move decompression off the main thread so GSAP
  // animations stay at 60fps even on the first appearance of a user avatar.
  useEffect(() => {
    const preloaded = preloadedRef.current
    // Deduplicate URLs (pool may contain repeated user avatars)
    const unique = Array.from(new Set(pool.map(p => p.imageUrl)))

    for (const url of unique) {
      if (preloaded.has(url)) continue
      preloaded.add(url)

      // Skip SVG data-URLs and blob: URLs — already in memory
      if (url.startsWith('data:') || url.startsWith('blob:')) continue

      const img = new Image()
      img.decoding = 'async'
      img.src = url
      // decode() resolves once the image is fully decoded and GPU-ready
      img.decode?.().catch(() => { /* non-fatal: image just won't be pre-warm */ })
    }
  }, [pool])

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
          // Optimise URLs before caching so the stored pool is already downscaled
          const optimised = optimisePool(images)
          savePool(optimised, ttlSeconds * 1000)
          setPool(shuffle(optimised))
        }
      })
      .catch(() => {
        setPool(shuffle(FALLBACK_POOL))
      })
  }, [])

  const nextImage = useCallback(() => {
    const recent = new Set(recentRef.current)
    const candidates = pool.filter(p => !recent.has(p.imageUrl))
    const last = recentRef.current[recentRef.current.length - 1] ?? ''
    // If the whole pool is in recent (small pool), pick anything except the last shown
    const fromList = candidates.length > 0
      ? candidates
      : pool.filter(p => p.imageUrl !== last)
    const next = fromList.length > 0
      ? fromList[Math.floor(Math.random() * fromList.length)]
      : pool[0]

    recentRef.current.push(next.imageUrl)
    const maxRecent = Math.max(2, Math.floor(pool.length / 3))
    if (recentRef.current.length > maxRecent) recentRef.current.shift()

    return next
  }, [pool])

  return { currentImage: pool[0], nextImage, pool }
}
