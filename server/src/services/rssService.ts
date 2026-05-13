import Parser from 'rss-parser'
import { ExternalFeedItem, type ExternalFeedRegion } from '../models/ExternalFeedItem.js'
import { logger } from '../utils/logger.js'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'REsonar/1.0 (music platform; +https://resonar.ar)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['itunes:image', 'itunesImage', { keepArray: false }],
    ],
  },
})

interface FeedDef {
  url: string
  label: string
  region: ExternalFeedRegion
  maxItems: number
}

// Prioridad: Argentina > Latinoamerica > Internacional.
// Si un feed AR/LATAM falla, la seccion sigue funcionando con los demas.
// Para agregar mas fuentes AR, anadir entradas con region: 'ar'.
const RSS_FEEDS: FeedDef[] = [
  { url: 'https://indiehoy.com/feed/', label: 'Indie Hoy', region: 'ar', maxItems: 2 },
  { url: 'https://www.lanacion.com.ar/espectaculos/musica/rss/', label: 'La Nacion Musica', region: 'ar', maxItems: 2 },
  { url: 'https://www.rollingstone.com.mx/feed/', label: 'Rolling Stone MX', region: 'latam', maxItems: 2 },
  { url: 'https://djmag.com/feed', label: 'DJ Mag', region: 'world', maxItems: 2 },
  { url: 'https://mixmag.net/feed', label: 'Mixmag', region: 'world', maxItems: 2 },
]

function extractImage(item: Record<string, unknown>): string | undefined {
  // 1. enclosure
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined
  if (enclosure?.url && enclosure.type?.startsWith('image')) return enclosure.url

  // 2. media:content (parsed as mediaContent)
  const mc = item.mediaContent as { $?: { url?: string }; url?: string } | undefined
  if (mc?.['$']?.url) return mc['$'].url
  if (typeof mc === 'string') return mc

  // 3. media:thumbnail
  const mt = item.mediaThumbnail as { $?: { url?: string } } | undefined
  if (mt?.['$']?.url) return mt['$'].url

  // 4. itunes:image
  const ii = item.itunesImage as { $?: { href?: string } } | undefined
  if (ii?.['$']?.href) return ii['$'].href

  // 5. First <img> in content or content:encoded
  const html = (item['content:encoded'] ?? item.content ?? '') as string
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (match?.[1]) return match[1]

  return undefined
}

export async function fetchAndCacheRss(): Promise<void> {
  const now = new Date()
  const items: Array<{
    type: 'news_article'
    source: 'rss'
    region: ExternalFeedRegion
    title: string
    subtitle: string
    imageUrl?: string
    url: string
    fetchedAt: Date
  }> = []

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      const recent = (parsed.items ?? []).slice(0, feed.maxItems)
      for (const item of recent) {
        if (!item.title || !item.link) continue
        items.push({
          type: 'news_article',
          source: 'rss',
          region: feed.region,
          title: item.title.slice(0, 180),
          subtitle: feed.label,
          imageUrl: extractImage(item as unknown as Record<string, unknown>),
          url: item.link,
          fetchedAt: now,
        })
      }
    } catch (err) {
      logger.warn(`RSS fetch fallido: ${feed.url}`, err)
    }
  }

  if (!items.length) return

  await ExternalFeedItem.deleteMany({ source: 'rss' })
  await ExternalFeedItem.insertMany(items)
  logger.info(`RSS: ${items.length} articulos cacheados`)
}
