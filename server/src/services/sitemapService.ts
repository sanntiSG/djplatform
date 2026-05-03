import { Profile } from '../models/Profile.js'
import { Event } from '../models/Event.js'
import { toSlug } from '../utils/slug.js'
import type { Types } from 'mongoose'

function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function urlEntry(loc: string, lastmod?: string, priority = '0.7'): string {
  const mod = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${mod}\n    <priority>${priority}</priority>\n  </url>`
}

export async function buildSitemap(baseUrl: string): Promise<string> {
  const staticPages = [
    { path: '/', priority: '1.0' },
    { path: '/profiles', priority: '0.9' },
    { path: '/events', priority: '0.9' },
  ]

  const [profiles, events] = await Promise.all([
    Profile.find({ isVisible: true })
      .select('artistName _id updatedAt')
      .lean() as Promise<{ _id: Types.ObjectId; artistName: string; updatedAt: Date }[]>,
    Event.find({ isVisible: true })
      .select('title _id updatedAt')
      .lean() as Promise<{ _id: Types.ObjectId; title: string; updatedAt: Date }[]>,
  ])

  const entries: string[] = [
    ...staticPages.map(({ path, priority }) => urlEntry(`${baseUrl}${path}`, undefined, priority)),
    ...profiles.map((p) =>
      urlEntry(
        `${baseUrl}/p/${toSlug(p.artistName)}-${p._id.toString()}`,
        p.updatedAt.toISOString().split('T')[0],
        '0.8',
      ),
    ),
    ...events.map((e) =>
      urlEntry(
        `${baseUrl}/events/${toSlug(e.title)}-${e._id.toString()}`,
        e.updatedAt.toISOString().split('T')[0],
        '0.7',
      ),
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`
}
