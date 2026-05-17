import mongoose, { type Document, type Types } from 'mongoose'

export interface ICollaboration extends Document {
  _id: Types.ObjectId
  fromProfileId: Types.ObjectId
  toProfileId: Types.ObjectId
  fromUserId: Types.ObjectId
  toUserId: Types.ObjectId
  title: string
  year?: number
  type?: 'track' | 'event' | 'visual' | 'other' | 'opportunity'
  eventId?: Types.ObjectId
  opportunityId?: Types.ObjectId
  confirmedByA: boolean
  confirmedByB: boolean
  confirmedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const collaborationSchema = new mongoose.Schema<ICollaboration>(
  {
    fromProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    toProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 120, trim: true },
    year: { type: Number, min: 1990, max: 2100 },
    type: { type: String, enum: ['track', 'event', 'visual', 'other', 'opportunity'] },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    confirmedByA: { type: Boolean, default: true },
    confirmedByB: { type: Boolean, default: false },
    confirmedAt: { type: Date },
  },
  { timestamps: true },
)

collaborationSchema.index({ fromProfileId: 1 })
collaborationSchema.index({ toProfileId: 1 })
collaborationSchema.index({ fromProfileId: 1, toProfileId: 1 })

export const Collaboration = mongoose.model<ICollaboration>('Collaboration', collaborationSchema)
