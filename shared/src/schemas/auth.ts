import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(100),
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, 'Credencial de Google requerida'),
})
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['user', 'admin']),
    mustChangePassword: z.boolean(),
    profileId: z.string().nullable(),
    createdAt: z.string(),
  }),
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
