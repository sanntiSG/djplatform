import { User } from '../models/User.js'
import type { IUser } from '../models/User.js'
import { signToken } from '../utils/jwt.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import type { AuthResponse, ChangePasswordInput } from '@dj/shared'

export function buildAuthResponse(user: IUser, token?: string): AuthResponse {
  const t = token ?? signToken({ sub: user._id.toString(), role: user.role })
  return {
    token: t,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      profileId: user.profileId?.toString() ?? null,
      createdAt: user.createdAt.toISOString(),
      notificationsAsked: user.notificationsAsked ?? false,
      pushOptIn: user.pushOptIn ?? false,
    },
  }
}

export async function changePassword(
  userId: string,
  data: ChangePasswordInput,
): Promise<AuthResponse> {
  const user = await User.findById(userId).select('+password')
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })

  if (user.password) {
    if (!data.currentPassword) {
      throw Object.assign(new Error('La contrasena actual es requerida'), { status: 400 })
    }
    const valid = await comparePassword(data.currentPassword, user.password)
    if (!valid) {
      throw Object.assign(new Error('La contrasena actual es incorrecta'), { status: 400 })
    }
  }

  user.password = await hashPassword(data.newPassword)
  user.mustChangePassword = false
  await user.save()

  return buildAuthResponse(user)
}
