import { z } from 'zod'

export const RoleSchema = z.enum(['user', 'admin'])
export type Role = z.infer<typeof RoleSchema>

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  mustChangePassword: z.boolean(),
  profileId: z.string().nullable(),
  createdAt: z.string(),
  notificationsAsked: z.boolean().default(false),
  pushOptIn: z.boolean().default(false),
})
export type UserResponse = z.infer<typeof UserResponseSchema>
