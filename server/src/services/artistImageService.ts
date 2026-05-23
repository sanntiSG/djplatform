import { logger } from '../utils/logger.js'

export interface ArtistImage {
  name: string
  imageUrl: string
  source: 'deezer' | 'spotify'
}

// Curated artist seed — electronic / underground + Argentine scene
const ARTIST_NAMES = [
  'Boris Brejcha',
  'Charlotte de Witte',
  'Amelie Lens',
  'Solomun',
  'Fisher',
  'Adam Beyer',
  'Richie Hawtin',
  'Nina Kraviz',
  'Peggy Gou',
  'Disclosure',
  'Four Tet',
  'Jon Hopkins',
  'Floating Points',
  'Bicep',
  'Objekt',
  'Bizarrap',
  'Catriel',
  'Bhavi',
  'Trueno',
  'Wos',
  'Tini',
  'Maria Becerra',
  'Nicki Nicole',
  'Neo Pistea',
  'Duki',
  'Paco Amoroso',
  'Lit Killah',
  'Ke Personaje',
  'Marttein',
  'Emanero',
]

interface SpotifyToken {
  token: string
  expiresAt: number
}

let poolCache: { images: ArtistImage[]; fetchedAt: number } | null = null
let spotifyToken: SpotifyToken | null = null

const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12h

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (spotifyToken && Date.now() < spotifyToken.expiresAt - 60_000) {
    return spotifyToken.token
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }
    spotifyToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
    return spotifyToken.token
  } catch {
    return null
  }
}

async function fetchFromDeezer(name: string): Promise<ArtistImage | null> {
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json() as { data?: Array<{ name: string; picture_xl: string }> }
    const artist = data.data?.[0]
    if (!artist?.picture_xl || artist.picture_xl.includes('no-artist')) return null
    return { name: artist.name, imageUrl: artist.picture_xl, source: 'deezer' }
  } catch {
    return null
  }
}

async function fetchFromSpotify(name: string, token: string): Promise<ArtistImage | null> {
  try {
    const url = `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(name)}&limit=1`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json() as { artists?: { items?: Array<{ name: string; images?: Array<{ url: string }> }> } }
    const artist = data.artists?.items?.[0]
    const imageUrl = artist?.images?.[0]?.url
    if (!imageUrl) return null
    return { name: artist!.name, imageUrl, source: 'spotify' }
  } catch {
    return null
  }
}

export async function getArtistImagePool(): Promise<ArtistImage[]> {
  if (poolCache && Date.now() - poolCache.fetchedAt < CACHE_TTL_MS) {
    return poolCache.images
  }

  const spotToken = await getSpotifyToken()
  const images: ArtistImage[] = []

  // Fetch in batches of 5 to avoid hammering APIs
  const batchSize = 5
  for (let i = 0; i < ARTIST_NAMES.length; i += batchSize) {
    const batch = ARTIST_NAMES.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (name) => {
        const deezer = await fetchFromDeezer(name)
        if (deezer) return deezer
        if (spotToken) return fetchFromSpotify(name, spotToken)
        return null
      }),
    )
    for (const r of results) {
      if (r) images.push(r)
    }
  }

  if (images.length > 0) {
    poolCache = { images, fetchedAt: Date.now() }
    logger.info(`Artist image pool refreshed: ${images.length} images (${images.filter(i => i.source === 'deezer').length} Deezer, ${images.filter(i => i.source === 'spotify').length} Spotify)`)
  }

  return images
}
