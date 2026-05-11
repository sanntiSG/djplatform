import mongoose, { type Document } from 'mongoose'

export interface IProfileType extends Document {
  name: string
  slug: string
  isActive: boolean
  isProtected: boolean // base types (dj/producer/other) cannot be deleted
  order: number
}

const profileTypeSchema = new mongoose.Schema<IProfileType>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, index: true },
  isActive: { type: Boolean, default: true },
  isProtected: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

export const ProfileType = mongoose.model<IProfileType>('ProfileType', profileTypeSchema)
