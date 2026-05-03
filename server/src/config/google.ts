import { OAuth2Client } from 'google-auth-library'
import { env } from './env.js'

export const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null
