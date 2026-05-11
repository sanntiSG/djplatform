import type { MediaResolveOutput } from '@dj/shared'

const YOUTUBE_REGEX = /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
const SPOTIFY_REGEX = /spotify\.com\/(track|playlist|album|episode)\/([A-Za-z0-9]+)/

export async function resolveMedia(url: string): Promise<MediaResolveOutput> {
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
    return {
      platform: 'soundcloud',
      url,
      embedHtml: data.html,
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
