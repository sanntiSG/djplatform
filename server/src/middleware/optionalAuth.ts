import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { findUserById } from '../services/userService.js'

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = header.slice(7)
    const payload = verifyToken(token)
    const user = await findUserById(payload.sub)
    if (user) {
      req.user = { id: user._id.toString(), role: user.role }
    }
  } catch {
    // token invalid — proceed as anonymous
  }

  next()
}
