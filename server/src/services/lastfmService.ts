import { ExternalFeedItem } from '../models/ExternalFeedItem.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const BASE = 'https://ws.audioscrobbler.com/2.0'

interface LastFmTrack {
  name: string
  artist: { name: string }
  image?: { '#text': string; size: string }[]
  url: string
}

interface LastFmArtist {
  name: string
  image?: { '#text': string; size: string }[]
  url: string
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchAndCacheLastFm(): Promise<void> {
  const key = env.LASTFM_API_KEY
  if (!key) return

  const [tracksAr, tracksGlobal] = await Promise.all([
    fetchJson<{ tracks: { track: LastFmTrack[] } }>(
      `${BASE}/?method=geo.gettoptracks&country=argentina&api_key=${key}&format=json&limit=5`,
    ),
    fetchJson<{ tracks: { track: LastFmTrack[] } }>(
      `${BASE}/?method=chart.gettoptracks&api_key=${key}&format=json&limit=3`,
    ),
  ])

  const items: Array<{
    type: 'trending_track'
    source: 'lastfm'
    title: string
    subtitle: string
    imageUrl?: string
    url: string
    fetchedAt: Date
  }> = []

  const now = new Date()

  const addTracks = (tracks: LastFmTrack[] | undefined, region: string) => {
    if (!tracks) return
    for (const t of tracks) {
      const img = t.image?.find(i => i.size === 'medium')?.['#text']
      items.push({
        type: 'trending_track',
        source: 'lastfm',
        title: t.name,
        subtitle: `${t.artist.name}${region ? ` · ${region}` : ''}`,
        imageUrl: img && !img.includes('2a96cbd8b46e442fc41c2b86b821562f') ? img : undefined,
        url: t.url,
        fetchedAt: now,
      })
    }
  }

  addTracks(tracksAr?.tracks?.track, 'Argentina')
  addTracks(tracksGlobal?.tracks?.track, 'Global')

  if (!items.length) return

  // Replace old lastfm items
  await ExternalFeedItem.deleteMany({ source: 'lastfm' })
  await ExternalFeedItem.insertMany(items)
  logger.info(`Last.fm: ${items.length} items cacheados`)
}
