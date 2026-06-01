import crypto from 'crypto'
import { env } from '../config/env.js'
import { ModerationCache } from '../models/ModerationCache.js'
import { logger } from '../utils/logger.js'

export interface ModerationResult {
  approved: boolean
  reasons: string[]
  cached: boolean
}

const MODELS = 'nudity-2.1,offensive,gore-2.0'

function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex')
}

async function callSightengineImage(imageUrl: string): Promise<ModerationResult> {
  if (!env.SIGHTENGINE_API_USER || !env.SIGHTENGINE_API_SECRET) {
    logger.warn('Sightengine no configurado — contenido aprobado por defecto')
    return { approved: true, reasons: [], cached: false }
  }

  const params = new URLSearchParams({
    url: imageUrl,
    models: MODELS,
    api_user: env.SIGHTENGINE_API_USER,
    api_secret: env.SIGHTENGINE_API_SECRET,
  })

  const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    logger.error('Sightengine request failed', { status: res.status })
    return { approved: true, reasons: [], cached: false }
  }

  const data = (await res.json()) as Record<string, unknown>

  if (data.status !== 'success') {
    logger.error('Sightengine error response', data)
    return { approved: true, reasons: [], cached: false }
  }

  const reasons: string[] = []

  const nudity = data.nudity as Record<string, number> | undefined
  if (nudity) {
    const explicit = (nudity.sexual_activity ?? 0) + (nudity.sexual_display ?? 0) + (nudity.erotica ?? 0)
    if (explicit > 0.3) reasons.push('nudity')
  }

  const offensive = data.offensive as Record<string, number> | undefined
  if (offensive && (offensive.prob ?? 0) > 0.5) reasons.push('offensive')

  const gore = data.gore as Record<string, number> | undefined
  if (gore && (gore.prob ?? 0) > 0.5) reasons.push('gore')

  const weapon = data.weapon as { classes?: Record<string, number> } | undefined
  if (weapon?.classes) {
    const { firearm = 0, knife = 0 } = weapon.classes
    if (firearm > 0.5 || knife > 0.6) reasons.push('weapon')
  }

  const drugs = data.drugs as number | undefined
  if (typeof drugs === 'number' && drugs > 0.5) reasons.push('drugs')

  return { approved: reasons.length === 0, reasons, cached: false }
}

async function callSightengineText(text: string): Promise<boolean> {
  if (!env.SIGHTENGINE_API_USER || !env.SIGHTENGINE_API_SECRET) return true

  const params = new URLSearchParams({
    text,
    lang: 'es',
    mode: 'ml',
    api_user: env.SIGHTENGINE_API_USER,
    api_secret: env.SIGHTENGINE_API_SECRET,
  })

  try {
    const res = await fetch('https://api.sightengine.com/1.0/text/check.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return true
    const data = (await res.json()) as { status?: string; moderation_classes?: { categories?: Record<string, number>[] } }
    if (data.status !== 'success') return true
    // If any high-intensity match → reject
    const matches = (data as { matches?: Array<{ intensity: string }> }).matches ?? []
    return !matches.some((m) => m.intensity === 'high')
  } catch {
    return true
  }
}

async function extractArtworkUrl(
  platform: string,
  mediaUrl: string,
  embedId?: string,
): Promise<string | null> {
  try {
    if (platform === 'youtube' && embedId) {
      return `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
    }
    if (platform === 'spotify') {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(mediaUrl)}`,
        { signal: AbortSignal.timeout(7000) },
      )
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as { thumbnail_url?: string }
        return data.thumbnail_url ?? null
      }
    }
    if (platform === 'soundcloud') {
      const oembedRes = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(mediaUrl)}&format=json`,
        { signal: AbortSignal.timeout(7000) },
      )
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as { thumbnail_url?: string }
        return data.thumbnail_url ?? null
      }
    }
  } catch {
    // ignore — pass through
  }
  return null
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const hash = hashUrl(imageUrl)
  const cached = await ModerationCache.findOne({ urlHash: hash })
  if (cached) {
    return { approved: cached.result === 'approved', reasons: cached.reasons, cached: true }
  }

  const result = await callSightengineImage(imageUrl)

  await ModerationCache.create({
    urlHash: hash,
    url: imageUrl,
    kind: 'image',
    result: result.approved ? 'approved' : 'rejected',
    reasons: result.reasons,
  })

  return result
}

export async function moderateTrack(
  platform: string,
  mediaUrl: string,
  title: string,
  embedId?: string,
): Promise<ModerationResult> {
  const cacheKey = `track:${mediaUrl}`
  const hash = hashUrl(cacheKey)
  const cached = await ModerationCache.findOne({ urlHash: hash })
  if (cached) {
    return { approved: cached.result === 'approved', reasons: cached.reasons, cached: true }
  }

  // Paralelizar: extraccion de artwork y moderacion de texto corren al mismo tiempo
  const [artworkUrl, textOk] = await Promise.all([
    extractArtworkUrl(platform, mediaUrl, embedId),
    title?.trim() ? callSightengineText(title.trim()) : Promise.resolve(true),
  ])

  const reasons: string[] = []

  if (artworkUrl) {
    const imgResult = await callSightengineImage(artworkUrl)
    reasons.push(...imgResult.reasons)
  }

  if (!textOk) reasons.push('inappropriate-text')

  const approved = reasons.length === 0

  await ModerationCache.create({
    urlHash: hash,
    url: mediaUrl,
    kind: 'track-artwork',
    result: approved ? 'approved' : 'rejected',
    reasons,
  })

  return { approved, reasons, cached: false }
}
