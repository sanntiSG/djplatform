import mongoose, { type Document, type Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  password?: string
  googleId?: string
  role: 'user' | 'admin'
  mustChangePassword: boolean
  profileId?: Types.ObjectId
  notificationsAsked: boolean
  pushOptIn: boolean
  notificationLevel: 'profile' | 'all'
  notificationOverrides: Map<string, boolean>
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    mustChangePassword: { type: Boolean, default: false },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    notificationsAsked: { type: Boolean, default: false },
    pushOptIn: { type: Boolean, default: false },
    notificationLevel: { type: String, enum: ['profile', 'all'], default: 'profile' },
    notificationOverrides: { type: Map, of: Boolean, default: new Map() },
  },
  { timestamps: true },
)

export const User = mongoose.model<IUser>('User', userSchema)
