import type { Request, Response, NextFunction } from 'express'
import * as notificationService from '../services/notificationService.js'

export async function getTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const types = await notificationService.getTypesForUser(req.user!.id)
    res.json(types)
  } catch (err) {
    next(err)
  }
}

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const prefs = await notificationService.getUserPreferences(req.user!.id)
    if (!prefs) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.json(prefs)
  } catch (err) {
    next(err)
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as {
      pushOptIn?: boolean
      notificationLevel?: 'profile' | 'all'
      overrides?: Record<string, boolean>
    }
    const result = await notificationService.updateUserPreferences(req.user!.id, data)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
