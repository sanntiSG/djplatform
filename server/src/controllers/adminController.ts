import type { Request, Response, NextFunction } from 'express'
import {
  getStats,
  adminListProfiles,
  adminSetProfileVisibility,
  adminDeleteProfile,
  adminListEvents,
  adminSetEventVisibility,
  adminDeleteEvent,
  adminListUsers,
} from '../services/adminService.js'

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getStats())
  } catch (err) {
    next(err)
  }
}

export async function listProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const visible = (req.query.visible as 'all' | 'true' | 'false' | undefined) ?? 'all'
    const profiles = await adminListProfiles({
      visible,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    res.json(profiles)
  } catch (err) {
    next(err)
  }
}

export async function setProfileVisibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { isVisible } = req.body as { isVisible: boolean }
    const profile = await adminSetProfileVisibility(req.params.id, Boolean(isVisible))
    res.json(profile)
  } catch (err) {
    next(err)
  }
}

export async function deleteProfile(req: Request, res: Response, next: NextFunction) {
  try {
    await adminDeleteProfile(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const visible = (req.query.visible as 'all' | 'true' | 'false' | undefined) ?? 'all'
    const events = await adminListEvents({
      visible,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    res.json(events)
  } catch (err) {
    next(err)
  }
}

export async function setEventVisibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { isVisible } = req.body as { isVisible: boolean }
    const event = await adminSetEventVisibility(req.params.id, Boolean(isVisible))
    res.json(event)
  } catch (err) {
    next(err)
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await adminDeleteEvent(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await adminListUsers({
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
}
