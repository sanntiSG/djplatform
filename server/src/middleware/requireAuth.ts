import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { findUserById } from '../services/userService.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: 'user' | 'admin'
      }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' })
      return
    }
    req.user = { id: user._id.toString(), role: user.role }
    next()
  } catch {
    res.status(401).json({ error: 'Token invalido' })
  }
}
