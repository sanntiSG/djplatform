import { z } from 'zod'
import 'dotenv/config'

const EnvSchema = z.object({
  PORT: z.string().default('4000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI requerido'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('ssantii200@gmail.com'),
  ADMIN_INITIAL_PASSWORD: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Error en variables de entorno:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
