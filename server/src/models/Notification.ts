import mongoose, { type Document, type Types } from 'mongoose'

export interface INotification extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: string
  actorId?: Types.ObjectId
  payload?: Record<string, unknown>
  url?: string
  readAt: Date | null
  createdAt: Date
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payload: { type: mongoose.Schema.Types.Mixed },
    url: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

notificationSchema.index({ userId: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
