import mongoose, { type Document, type Types } from 'mongoose'

export interface IEvent extends Document {
  _id: Types.ObjectId
  profileId: Types.ObjectId
  title: string
  description?: string
  date: Date
  location?: string
  locationVerified?: boolean
  cover?: string
  media: string[]
  isVisible: boolean
  likeCount: number
  attendCount: number
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

const eventSchema = new mongoose.Schema<IEvent>(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000 },
    date: { type: Date, required: true },
    location: { type: String, maxlength: 200 },
    locationVerified: { type: Boolean, default: false },
    cover: { type: String },
    media: [{ type: String }],
    isVisible: { type: Boolean, default: true },
    likeCount: { type: Number, default: 0 },
    attendCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

eventSchema.index({ profileId: 1, isVisible: 1 })
eventSchema.index({ date: -1 })
eventSchema.index({ isVisible: 1, date: -1 })

export const Event = mongoose.model<IEvent>('Event', eventSchema)
