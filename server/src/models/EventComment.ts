import mongoose, { type Document, type Types } from 'mongoose'

export interface IEventComment extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  eventId: Types.ObjectId
  userEmail: string
  text: string
  createdAt: Date
}

const schema = new mongoose.Schema<IEventComment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ eventId: 1, createdAt: -1 })
schema.index({ userId: 1 })

export const EventComment = mongoose.model<IEventComment>('EventComment', schema)
