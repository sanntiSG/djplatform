import { NotificationType } from '../models/NotificationType.js'
import { User } from '../models/User.js'
import type { IUser } from '../models/User.js'

export interface TypeWithUserState {
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
  enabledByAdmin: boolean
  userEnabled: boolean
}

export async function getTypesForUser(userId: string): Promise<TypeWithUserState[]> {
  const [types, user] = await Promise.all([
    NotificationType.find({ enabledByAdmin: true }).lean(),
    User.findById(userId),
  ])
  if (!user) return []

  return types.map(t => ({
    key: t.key,
    label: t.label,
    description: t.description,
    category: t.category,
    enabledByAdmin: t.enabledByAdmin,
    userEnabled: isTypeEnabledForUser(user, t.key, t.category),
  }))
}

export async function getUserPreferences(userId: string) {
  const user = await User.findById(userId)
  if (!user) return null
  return {
    pushOptIn: user.pushOptIn ?? false,
    notificationLevel: user.notificationLevel ?? 'profile',
    overrides: Object.fromEntries(user.notificationOverrides ?? new Map()),
  }
}

export async function updateUserPreferences(
  userId: string,
  data: {
    pushOptIn?: boolean
    notificationLevel?: 'profile' | 'all'
    overrides?: Record<string, boolean>
  },
) {
  const user = await User.findById(userId)
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })

  if (data.pushOptIn !== undefined) user.pushOptIn = data.pushOptIn
  if (data.notificationLevel !== undefined) user.notificationLevel = data.notificationLevel
  if (data.overrides) {
    for (const [key, val] of Object.entries(data.overrides)) {
      user.notificationOverrides.set(key, val)
    }
  }

  await user.save()
  return {
    pushOptIn: user.pushOptIn,
    notificationLevel: user.notificationLevel,
    overrides: Object.fromEntries(user.notificationOverrides),
  }
}

/** Returns true if the user should receive this notification type. */
export function isTypeEnabledForUser(
  user: IUser,
  typeKey: string,
  category: 'profile' | 'all',
): boolean {
  // Check explicit override first
  const override = user.notificationOverrides?.get(typeKey)
  if (override !== undefined) return override

  // Category 'all' requires level 'all'
  if (category === 'all' && user.notificationLevel !== 'all') return false

  return true
}

/** Full check: admin + user combined. */
export async function isTypeEffectivelyEnabled(user: IUser, typeKey: string): Promise<boolean> {
  const type = await NotificationType.findOne({ key: typeKey }).lean()
  if (!type || !type.enabledByAdmin) return false
  return isTypeEnabledForUser(user, typeKey, type.category)
}
