import type { Request, Response, NextFunction } from 'express'
import { RegisterSchema, LoginSchema, GoogleAuthSchema, ChangePasswordSchema } from '@dj/shared'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'
import { buildAuthResponse, changePassword as changePasswordService } from '../services/authService.js'
import { deleteAccount as deleteAccountService } from '../services/accountDeletionService.js'
import {
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById,
  createUser,
  upsertGoogleUser,
} from '../services/userService.js'
import { googleClient } from '../config/google.js'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = RegisterSchema.parse(req.body)

    const existing = await findUserByEmail(email)
    if (existing) {
      res.status(409).json({ error: 'El email ya esta registrado' })
      return
    }

    const hashed = await hashPassword(password)
    const user = await createUser({ email, password: hashed })
    const response = buildAuthResponse(user)

    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = LoginSchema.parse(req.body)

    const user = await findUserByEmailWithPassword(email)
    if (!user || !user.password) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    res.json(buildAuthResponse(user))
  } catch (err) {
    next(err)
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { credential } = GoogleAuthSchema.parse(req.body)

    if (!googleClient) {
      res.status(503).json({ error: 'Google OAuth no configurado' })
      return
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.email || !payload.sub) {
      res.status(400).json({ error: 'Token de Google invalido' })
      return
    }

    const user = await upsertGoogleUser({ email: payload.email, googleId: payload.sub })
    res.json(buildAuthResponse(user))
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = ChangePasswordSchema.parse(req.body)
    const response = await changePasswordService(req.user!.id, data)
    res.json(response)
  } catch (err) {
    next(err)
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteAccountService(req.user!.id)
    // 202 Accepted: account is invalidated. Background cascade continues asynchronously.
    res.status(202).json({ message: 'Cuenta eliminada' })
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await findUserById(req.user!.id)
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      profileId: user.profileId?.toString() ?? null,
      createdAt: user.createdAt.toISOString(),
      notificationsAsked: user.notificationsAsked ?? false,
      pushOptIn: user.pushOptIn ?? false,
    })
  } catch (err) {
    next(err)
  }
}
