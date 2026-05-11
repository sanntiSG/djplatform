import { Schema, model, type Document } from 'mongoose'

export interface IModerationCache extends Document {
  urlHash: string
  url: string
  kind: 'image' | 'track-artwork'
  result: 'approved' | 'rejected'
  reasons: string[]
  createdAt: Date
}

const ModerationCacheSchema = new Schema<IModerationCache>(
  {
    urlHash: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    kind: { type: String, enum: ['image', 'track-artwork'], required: true },
    result: { type: String, enum: ['approved', 'rejected'], required: true },
    reasons: [{ type: String }],
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // TTL 30 days
  },
  { versionKey: false },
)

export const ModerationCache = model<IModerationCache>('ModerationCache', ModerationCacheSchema)
