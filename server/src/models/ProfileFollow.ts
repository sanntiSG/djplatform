import mongoose, { type Document, type Types } from 'mongoose'

export interface IProfileFollow extends Document {
  followerId: Types.ObjectId
  followedId: Types.ObjectId
  createdAt: Date
}

const schema = new mongoose.Schema<IProfileFollow>(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ followerId: 1, followedId: 1 }, { unique: true })
schema.index({ followedId: 1 })
schema.index({ followerId: 1 })

export const ProfileFollow = mongoose.model<IProfileFollow>('ProfileFollow', schema)
