import mongoose, { type Document, type Types } from 'mongoose'

export interface IProfileLike extends Document {
  userId: Types.ObjectId
  profileId: Types.ObjectId
  createdAt: Date
}

const schema = new mongoose.Schema<IProfileLike>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ userId: 1, profileId: 1 }, { unique: true })
schema.index({ profileId: 1 })

export const ProfileLike = mongoose.model<IProfileLike>('ProfileLike', schema)
