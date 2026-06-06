import mongoose, { type Document, type Types } from 'mongoose'

export type ActivityEventType =
  | 'profile_created'
  | 'event_published'
  | 'media_added'
  | 'photo_added'
  | 'profile_updated'
  | 'profile_followed'
  | 'collab_verified'
  | 'opportunity_posted'
  | 'project_created'

export interface IActivityEvent extends Document {
  _id: Types.ObjectId
  type: ActivityEventType
  actorProfileId: Types.ObjectId
  actorName: string
  actorAvatar?: string
  actorSlug?: string
  targetTitle?: string
  targetUrl?: string
  targetImage?: string
  partnerName?: string
  partnerAvatar?: string
  partnerSlug?: string
  createdAt: Date
}

const schema = new mongoose.Schema<IActivityEvent>(
  {
    type: {
      type: String,
      enum: ['profile_created', 'event_published', 'media_added', 'photo_added', 'profile_updated', 'profile_followed', 'collab_verified', 'opportunity_posted', 'project_created'],
      required: true,
    },
    actorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    actorName: { type: String, required: true },
    actorAvatar: { type: String },
    actorSlug: { type: String },
    targetTitle: { type: String },
    targetUrl: { type: String },
    targetImage: { type: String },
    partnerName: { type: String },
    partnerAvatar: { type: String },
    partnerSlug: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

schema.index({ createdAt: -1 })
schema.index({ actorProfileId: 1 })

// TTL: auto-delete after 7 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })

export const ActivityEvent = mongoose.model<IActivityEvent>('ActivityEvent', schema)
