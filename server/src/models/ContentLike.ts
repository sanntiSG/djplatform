import mongoose, { type Document, type Types } from 'mongoose'

export interface IContentLike extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId
  targetKind: 'photo' | 'media'
  targetId: Types.ObjectId
  createdAt: Date
}

const schema = new mongoose.Schema<IContentLike>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    targetKind: { type: String, enum: ['photo', 'media'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ userId: 1, profileId: 1, targetKind: 1, targetId: 1 }, { unique: true })
schema.index({ profileId: 1, targetKind: 1, targetId: 1 })

export const ContentLike = mongoose.model<IContentLike>('ContentLike', schema)
