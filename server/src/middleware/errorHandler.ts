import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos invalidos', details: err.flatten().fieldErrors })
    return
  }

  if (err instanceof Error) {
    logger.error(err.message, err.stack)
    const status = (err as { status?: number }).status ?? 500
    const message = status < 500 ? err.message : 'Error interno del servidor'
    res.status(status).json({ error: message })
    return
  }

  logger.error('Error desconocido', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
