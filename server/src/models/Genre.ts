import mongoose, { type Document } from 'mongoose'

export interface IGenre extends Document {
  name: string
  slug: string
  isActive: boolean
  order: number
}

const genreSchema = new mongoose.Schema<IGenre>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
})

export const Genre = mongoose.model<IGenre>('Genre', genreSchema)
