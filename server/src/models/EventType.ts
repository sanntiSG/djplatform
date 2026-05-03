import mongoose, { type Document } from 'mongoose'

export interface IEventType extends Document {
  name: string
  slug: string
  isActive: boolean
  order: number
}

const eventTypeSchema = new mongoose.Schema<IEventType>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
})

export const EventType = mongoose.model<IEventType>('EventType', eventTypeSchema)
