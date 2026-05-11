import type { Request, Response, NextFunction } from 'express'
import { getGenres, getEventTypes } from '../services/catalogService.js'
import { publicListProfileTypes } from '../services/adminService.js'

export async function listGenres(req: Request, res: Response, next: NextFunction) {
  try {
    const genres = await getGenres()
    res.json(genres.map((g) => ({ id: g._id?.toString(), name: g.name, slug: g.slug })))
  } catch (err) {
    next(err)
  }
}

export async function listEventTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const types = await getEventTypes()
    res.json(types.map((t) => ({ id: t._id?.toString(), name: t.name, slug: t.slug })))
  } catch (err) {
    next(err)
  }
}

export async function listProfileTypes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await publicListProfileTypes())
  } catch (err) {
    next(err)
  }
}
