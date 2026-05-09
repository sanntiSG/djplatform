import mongoose, { type Document, type Types } from 'mongoose'

export interface IContentComment extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  profileId: Types.ObjectId
  targetKind: 'photo' | 'media'
  targetId: Types.ObjectId
  parentId?: Types.ObjectId
  userEmail: string
  text: string
  likedBy: Types.ObjectId[]
  likeCount: number
  editedAt?: Date
  createdAt: Date
}

const schema = new mongoose.Schema<IContentComment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    targetKind: { type: String, enum: ['photo', 'media'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentComment', default: null },
    userEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    editedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ profileId: 1, targetKind: 1, targetId: 1, parentId: 1, createdAt: -1 })
schema.index({ userId: 1 })

export const ContentComment = mongoose.model<IContentComment>('ContentComment', schema)
