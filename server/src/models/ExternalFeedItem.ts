import mongoose, { type Document, type Types } from 'mongoose'

export type ExternalFeedType = 'trending_track' | 'trending_artist' | 'news_article'
export type ExternalFeedSource = 'lastfm' | 'rss'
export type ExternalFeedRegion = 'ar' | 'latam' | 'world'

export interface IExternalFeedItem extends Document {
  _id: Types.ObjectId
  type: ExternalFeedType
  source: ExternalFeedSource
  region: ExternalFeedRegion
  title: string
  subtitle?: string
  imageUrl?: string
  url: string
  fetchedAt: Date
}

const schema = new mongoose.Schema<IExternalFeedItem>(
  {
    type: { type: String, enum: ['trending_track', 'trending_artist', 'news_article'], required: true },
    source: { type: String, enum: ['lastfm', 'rss'], required: true },
    region: { type: String, enum: ['ar', 'latam', 'world'], default: 'world' },
    title: { type: String, required: true, maxlength: 200 },
    subtitle: { type: String, maxlength: 200 },
    imageUrl: { type: String },
    url: { type: String, required: true },
    fetchedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: false },
)

schema.index({ fetchedAt: -1 })
schema.index({ source: 1, type: 1 })
// TTL: auto-delete after 12 hours
schema.index({ fetchedAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 })

export const ExternalFeedItem = mongoose.model<IExternalFeedItem>('ExternalFeedItem', schema)
