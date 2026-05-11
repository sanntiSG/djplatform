import DOMPurify from 'isomorphic-dompurify'
import type { MediaResolveOutput } from '@dj/shared'

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
  const ytMatch = url.match(YOUTUBE_REGEX)
  if (ytMatch) {
    return {
      platform: 'youtube',
      url,
      embedId: ytMatch[1],
      type: 'video',
      description: '',
      genres: [],
    }
  }

  const spMatch = url.match(SPOTIFY_REGEX)
  if (spMatch) {
    return {
      platform: 'spotify',
      url,
      embedId: `${spMatch[1]}/${spMatch[2]}`,
      type: 'audio',
      description: '',
      genres: [],
    }
  }

  if (url.includes('soundcloud.com')) {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(oembedUrl)
    if (!res.ok) {
      throw Object.assign(new Error('No se pudo resolver el link de SoundCloud'), { status: 422 })
    }
    const data = (await res.json()) as { html?: string; title?: string }
    const rawHtml = typeof data.html === 'string' ? data.html : ''
    const safeHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['iframe'],
      ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'scrolling', 'style', 'title'],
    })
    return {
      platform: 'soundcloud',
      url,
      embedHtml: safeHtml,
      type: 'audio',
      title: data.title,
      description: '',
      genres: [],
    }
  }

  throw Object.assign(new Error('Plataforma no reconocida. Solo YouTube, SoundCloud y Spotify.'), {
    status: 422,
  })
}
