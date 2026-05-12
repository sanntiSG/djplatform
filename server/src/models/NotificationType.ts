import mongoose, { type Document } from 'mongoose'

export interface INotificationType extends Document {
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
  enabledByAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationTypeSchema = new mongoose.Schema<INotificationType>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: ['profile', 'all'], required: true },
    enabledByAdmin: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const NotificationType = mongoose.model<INotificationType>('NotificationType', notificationTypeSchema)
