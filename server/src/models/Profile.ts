import mongoose, { type Document, type Types } from 'mongoose'

interface IMediaItem {
  platform: 'youtube' | 'soundcloud' | 'spotify'
  url: string
  embedId?: string
  embedHtml?: string
  type: 'audio' | 'video'
  title?: string
  description?: string
  genres?: string[]
  addedAt?: Date
}

interface IPhoto {
  _id?: Types.ObjectId
  url: string
  caption?: string
  addedAt: Date
}

export interface IProfile extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: 'dj' | 'producer' | 'other'
  artistName: string
  bio?: string
  avatar?: string
  coverImage?: string
  theme?: 'minimal' | 'neon' | 'cosmic' | 'fire' | 'void'
  accentColor?: string
  location?: string
  locationVerified?: boolean
  genres: string[]
  eventTypes: string[]
  availability: 'available' | 'contact' | 'unavailable'
  whatsapp?: string
  media: IMediaItem[]
  photos: IPhoto[]
  priceRange?: string
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

const mediaItemSchema = new mongoose.Schema<IMediaItem>(
  {
    platform: { type: String, enum: ['youtube', 'soundcloud', 'spotify'], required: true },
    url: { type: String, required: true },
    embedId: { type: String },
    embedHtml: { type: String },
    type: { type: String, enum: ['audio', 'video'], required: true },
    title: { type: String },
    description: { type: String, default: '', maxlength: 1000 },
    genres: {
      type: [String],
      default: [],
      validate: { validator: (v: string[]) => v.length <= 3, message: 'Max 3 generos por track' },
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const photoSchema = new mongoose.Schema<IPhoto>(
  {
    url: { type: String, required: true },
    caption: { type: String, maxlength: 500 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const profileSchema = new mongoose.Schema<IProfile>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    type: { type: String, enum: ['dj', 'producer', 'other'], required: true },
    artistName: { type: String, required: true, trim: true, maxlength: 60 },
    bio: { type: String, maxlength: 1000 },
    avatar: { type: String },
    coverImage: { type: String },
    theme: { type: String, enum: ['minimal', 'neon', 'cosmic', 'fire', 'void'], default: 'minimal' },
    accentColor: { type: String, maxlength: 20 },
    location: { type: String, maxlength: 100 },
    locationVerified: { type: Boolean, default: false },
    genres: [{ type: String }],
    eventTypes: [{ type: String }],
    availability: {
      type: String,
      enum: ['available', 'contact', 'unavailable'],
      default: 'contact',
    },
    whatsapp: { type: String },
    media: [mediaItemSchema],
    photos: [photoSchema],
    priceRange: { type: String },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
)

profileSchema.index({ type: 1, isVisible: 1 })
profileSchema.index({ location: 1 })
profileSchema.index({ genres: 1 })
profileSchema.index({ 'media.genres': 1 })
profileSchema.index({ eventTypes: 1 })
profileSchema.index({ availability: 1, isVisible: 1 })
profileSchema.index({ artistName: 'text', bio: 'text' }, { weights: { artistName: 10, bio: 1 } })

export const Profile = mongoose.model<IProfile>('Profile', profileSchema)
