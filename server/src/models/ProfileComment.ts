import mongoose, { type Document, type Types } from 'mongoose'

export interface IProfileComment extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId
  userEmail: string
  text: string
  createdAt: Date
}

const schema = new mongoose.Schema<IProfileComment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ profileId: 1, createdAt: -1 })
schema.index({ userId: 1 })

export const ProfileComment = mongoose.model<IProfileComment>('ProfileComment', schema)
