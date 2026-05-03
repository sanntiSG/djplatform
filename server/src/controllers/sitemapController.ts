import type { Request, Response, NextFunction } from 'express'
import { buildSitemap } from '../services/sitemapService.js'
import { env } from '../config/env.js'

export async function getSitemap(req: Request, res: Response, next: NextFunction) {
  try {
    const baseUrl = env.CLIENT_URL.replace(/\/$/, '')
    const xml = await buildSitemap(baseUrl)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch (err) {
    next(err)
  }
}
