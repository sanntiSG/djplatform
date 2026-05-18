import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getSettings, updateSettings } from '../services/systemSettingsService.js'
import { restartTrendingCron } from '../jobs/trendingCron.js'
import {
  getStats,
  adminListProfiles,
  adminSetProfileVisibility,
  adminDeleteProfile,
  adminListEvents,
  adminSetEventVisibility,
  adminDeleteEvent,
  adminListUsers,
  adminListGenres,
  adminCreateGenre,
  adminUpdateGenre,
  adminDeleteGenre,
  adminListProfileTypes,
  adminCreateProfileType,
  adminUpdateProfileType,
  adminDeleteProfileType,
  getDbStats,
  cleanupInactiveProfiles,
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

export async function listGenres(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminListGenres())
  } catch (err) {
    next(err)
  }
}

export async function createGenre(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body as { name: string }
    if (!name?.trim()) { res.status(400).json({ error: 'El nombre es requerido' }); return }
    const genre = await adminCreateGenre(name)
    res.status(201).json(genre)
  } catch (err) {
    next(err)
  }
}

export async function updateGenre(req: Request, res: Response, next: NextFunction) {
  try {
    const genre = await adminUpdateGenre(req.params.id, req.body as { isActive?: boolean; name?: string })
    res.json(genre)
  } catch (err) {
    next(err)
  }
}

export async function deleteGenre(req: Request, res: Response, next: NextFunction) {
  try {
    await adminDeleteGenre(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function listProfileTypes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminListProfileTypes())
  } catch (err) {
    next(err)
  }
}

export async function createProfileType(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body as { name: string }
    if (!name?.trim()) { res.status(400).json({ error: 'El nombre es requerido' }); return }
    const pt = await adminCreateProfileType(name)
    res.status(201).json(pt)
  } catch (err) {
    next(err)
  }
}

export async function updateProfileType(req: Request, res: Response, next: NextFunction) {
  try {
    const pt = await adminUpdateProfileType(req.params.id, req.body as { isActive?: boolean; name?: string })
    res.json(pt)
  } catch (err) {
    next(err)
  }
}

export async function deleteProfileType(req: Request, res: Response, next: NextFunction) {
  try {
    await adminDeleteProfileType(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function dbStats(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getDbStats())
  } catch (err) {
    next(err)
  }
}

export async function cleanupInactive(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cleanupInactiveProfiles()
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getSettings()
    res.json({
      trendingRefreshMinutes: settings.trendingRefreshMinutes,
      collabsFeedTtlHours: settings.collabsFeedTtlHours ?? 8,
    })
  } catch (err) {
    next(err)
  }
}

export async function updateSystem(req: Request, res: Response, next: NextFunction) {
  try {
    const { trendingRefreshMinutes, collabsFeedTtlHours } = z
      .object({
        trendingRefreshMinutes: z.number().int().min(1).max(1440),
        collabsFeedTtlHours: z.number().int().min(1).max(168).optional(),
      })
      .parse(req.body)
    const settings = await updateSettings({ trendingRefreshMinutes, collabsFeedTtlHours })
    restartTrendingCron(trendingRefreshMinutes)
    res.json({
      trendingRefreshMinutes: settings.trendingRefreshMinutes,
      collabsFeedTtlHours: settings.collabsFeedTtlHours ?? 8,
    })
  } catch (err) {
    next(err)
  }
}

