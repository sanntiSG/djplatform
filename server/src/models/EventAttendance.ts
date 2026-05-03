import mongoose, { type Document, type Types } from 'mongoose'

export interface IEventAttendance extends Document {
  userId: Types.ObjectId
  eventId: Types.ObjectId
  createdAt: Date
}

const schema = new mongoose.Schema<IEventAttendance>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ userId: 1, eventId: 1 }, { unique: true })
schema.index({ eventId: 1 })

export const EventAttendance = mongoose.model<IEventAttendance>('EventAttendance', schema)
