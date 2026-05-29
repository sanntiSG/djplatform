import mongoose, { type Document, type Types } from 'mongoose'

export interface ISavedMedia extends Document {
  userId: Types.ObjectId
  profileId: Types.ObjectId
  mediaId: Types.ObjectId
  savedAt: Date
}

const schema = new mongoose.Schema<ISavedMedia>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  savedAt: { type: Date, default: Date.now },
})

schema.index({ userId: 1, mediaId: 1 }, { unique: true })
schema.index({ userId: 1, savedAt: -1 })

export const SavedMedia = mongoose.model<ISavedMedia>('SavedMedia', schema)
