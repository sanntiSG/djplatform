import type { UserResponse } from '../types/index.js'

export function publishProfileTarget(user: UserResponse | null, token: string | null): string | null {
  if (!token || !user) return '/auth/register'
  if (!user.profileId) return '/profile/setup'
  return null
}
