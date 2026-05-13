import type { Request, Response, NextFunction } from 'express'
import { getRecentActivity } from '../services/activityService.js'

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 20
    const events = await getRecentActivity(limit)
    res.json(events)
  } catch (err) {
    next(err)
  }
}
