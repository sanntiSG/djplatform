import { User, type IUser } from '../models/User.js'

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() })
}

export async function findUserByEmailWithPassword(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() }).select('+password')
}

export async function findUserById(id: string): Promise<IUser | null> {
  return User.findById(id)
}

export async function createUser(data: {
  email: string
  password?: string
  googleId?: string
  role?: 'user' | 'admin'
  mustChangePassword?: boolean
}): Promise<IUser> {
  return User.create(data)
}

export async function upsertGoogleUser(data: {
  email: string
  googleId: string
}): Promise<IUser> {
  const existing = await User.findOne({
    $or: [{ googleId: data.googleId }, { email: data.email }],
  })

  if (existing) {
    if (!existing.googleId) {
      existing.googleId = data.googleId
      await existing.save()
    }
    return existing
  }

  return User.create({ email: data.email, googleId: data.googleId, role: 'user' })
}
