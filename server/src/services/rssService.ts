import Parser from 'rss-parser'
import { ExternalFeedItem } from '../models/ExternalFeedItem.js'
import { logger } from '../utils/logger.js'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'REsonar/1.0 (music platform; +https://resonar.ar)' },
})

const RSS_FEEDS = [
  { url: 'https://djmag.com/feed', label: 'DJ Mag' },
  { url: 'https://mixmag.net/feed', label: 'Mixmag' },
]

export async function fetchAndCacheRss(): Promise<void> {
  const now = new Date()
  const items: Array<{
    type: 'news_article'
    source: 'rss'
    title: string
    subtitle: string
    imageUrl?: string
    url: string
    fetchedAt: Date
  }> = []

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      const recent = (parsed.items ?? []).slice(0, 3)
      for (const item of recent) {
        if (!item.title || !item.link) continue
        items.push({
          type: 'news_article',
          source: 'rss',
          title: item.title.slice(0, 180),
          subtitle: feed.label,
          imageUrl: (item as Record<string, unknown>)?.['media:content']
            ? String((item as Record<string, string>)['media:content'])
            : undefined,
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
