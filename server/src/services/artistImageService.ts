import { logger } from '../utils/logger.js'
import { Profile } from '../models/Profile.js'

export interface ArtistImage {
  name: string
  imageUrl: string
  source: 'deezer' | 'spotify' | 'user'
  userId?: string
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
const TARGET_POOL_SIZE = 18
const USER_RATIO = 0.5  // ~50% of pool from real REsonar users
const MAX_PER_USER = 2  // allow each user avatar to appear up to this many times

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

/** Fetch real REsonar user avatars for the discovery feature */
async function fetchUserAvatars(): Promise<ArtistImage[]> {
  try {
    const profiles = await Profile.find(
      { isVisible: true, avatar: { $exists: true, $ne: '' } },
      { artistName: 1, avatar: 1, userId: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(60)
      .lean()

    return profiles
      .filter(p => p.avatar && p.artistName)
      .map(p => ({
        name: p.artistName,
        imageUrl: p.avatar!,
        source: 'user' as const,
        userId: String(p._id), // profile _id used to build /p/:id link
      }))
  } catch (err) {
    logger.error('fetchUserAvatars failed', { err })
    return []
  }
}

/** Fetch external (Deezer/Spotify) images from the curated seed list */
async function fetchExternalImages(): Promise<ArtistImage[]> {
  const spotToken = await getSpotifyToken()
  const images: ArtistImage[] = []

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

  return images
}

export async function getArtistImagePool(): Promise<ArtistImage[]> {
  if (poolCache && Date.now() - poolCache.fetchedAt < CACHE_TTL_MS) {
    return poolCache.images
  }

  // Fetch user avatars and external images in parallel
  const [userImages, externalImages] = await Promise.all([
    fetchUserAvatars(),
    fetchExternalImages(),
  ])

  // Blend: ~50% users, ~50% external, with cyclic repetition for users (max MAX_PER_USER per user)
  const desiredUsers   = Math.ceil(TARGET_POOL_SIZE * USER_RATIO)         //  9
  const externalSlots  = TARGET_POOL_SIZE - desiredUsers                   //  9

  // Build user pool cycling through shuffled unique users until quota is reached.
  // With few users each can appear up to MAX_PER_USER times;
  // with many users each appears at most once (quota reached before second cycle).
  const userCap = Math.min(desiredUsers, userImages.length * MAX_PER_USER)
  const shuffledUsers = shuffleArray(userImages)
  const userPool: ArtistImage[] = []
  for (let i = 0; userPool.length < userCap; i++) {
    userPool.push(shuffledUsers[i % shuffledUsers.length])
  }

  const externalPool = shuffleArray(externalImages).slice(0, externalSlots)

  const images = shuffleArray([...userPool, ...externalPool])

  if (images.length > 0) {
    poolCache = { images, fetchedAt: Date.now() }
    logger.info(
      `Artist image pool refreshed: ${images.length} images — `
      + `${images.filter(i => i.source === 'user').length} users, `
      + `${images.filter(i => i.source === 'deezer').length} Deezer, `
      + `${images.filter(i => i.source === 'spotify').length} Spotify`,
    )
  }

  return images
}
