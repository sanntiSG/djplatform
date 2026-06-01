import DOMPurify from 'isomorphic-dompurify'
import type { MediaResolveOutput } from '@dj/shared'
import { cache } from './cache.js'

const OEMBED_TTL = 24 * 60 * 60 * 1000  // 24h — oEmbed cambia raramente

const YOUTUBE_REGEX = /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
const SPOTIFY_REGEX = /spotify\.com\/(track|playlist|album|episode)\/([A-Za-z0-9]+)/

const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'spotify.com',
  'open.spotify.com',
  'soundcloud.com',
  'on.soundcloud.com',
  'www.soundcloud.com',
]

function validateMediaUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw Object.assign(new Error('URL no valida.'), { status: 422 })
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw Object.assign(new Error('Protocolo no permitido.'), { status: 422 })
  }
  const host = parsed.hostname.toLowerCase()
  if (!ALLOWED_HOSTS.includes(host)) {
    throw Object.assign(new Error('Plataforma no reconocida. Solo YouTube, SoundCloud y Spotify.'), {
      status: 422,
    })
  }
}

export async function resolveMedia(url: string): Promise<MediaResolveOutput> {
  validateMediaUrl(url)

  // Cache por URL — evita re-consultar oEmbed de SoundCloud/Spotify en cada request.
  // YouTube no hace fetch externo pero igual cachea para consistencia.
  const cacheKey = `oembed:${url}`
  const cached = cache.get<MediaResolveOutput>(cacheKey)
  if (cached) return cached

  let result: MediaResolveOutput

  const ytMatch = url.match(YOUTUBE_REGEX)
  if (ytMatch) {
    result = {
      platform: 'youtube',
      url,
      embedId: ytMatch[1],
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
      type: 'video',
      description: '',
      genres: [],
    }
    cache.set(cacheKey, result, OEMBED_TTL)
    return result
  }

  const spMatch = url.match(SPOTIFY_REGEX)
  if (spMatch) {
    let thumbnailUrl: string | undefined
    try {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(7000) },
      )
      if (oembedRes.ok) {
        const oembedData = (await oembedRes.json()) as { thumbnail_url?: string; title?: string }
        thumbnailUrl = oembedData.thumbnail_url
      }
    } catch { /* non-fatal: thumbnail es opcional */ }
    result = {
      platform: 'spotify',
      url,
      embedId: `${spMatch[1]}/${spMatch[2]}`,
      type: 'audio',
      thumbnailUrl,
      description: '',
      genres: [],
    }
    cache.set(cacheKey, result, OEMBED_TTL)
    return result
  }

  if (url.includes('soundcloud.com')) {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      throw Object.assign(new Error('No se pudo resolver el link de SoundCloud'), { status: 422 })
    }
    const data = (await res.json()) as { html?: string; title?: string; thumbnail_url?: string }
    const rawHtml = typeof data.html === 'string' ? data.html : ''
    // DOMPurify.sanitize carga jsdom — el resultado se cachea para no re-sanitizar la misma URL
    const safeHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['iframe'],
      ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'scrolling', 'style', 'title'],
    })
    result = {
      platform: 'soundcloud',
      url,
      embedHtml: safeHtml,
      thumbnailUrl: data.thumbnail_url,
      type: 'audio',
      title: data.title,
      description: '',
      genres: [],
    }
    cache.set(cacheKey, result, OEMBED_TTL)
    return result
  }

  throw Object.assign(new Error('Plataforma no reconocida. Solo YouTube, SoundCloud y Spotify.'), {
    status: 422,
  })
}
