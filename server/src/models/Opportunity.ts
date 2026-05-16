import mongoose, { type Document, type Types } from 'mongoose'

export interface IOpportunity extends Document {
  _id: Types.ObjectId
  profileId: Types.ObjectId
  userId: Types.ObjectId
  artistName: string
  avatar?: string
  title: string
  description?: string
  lookingForRoles: string[]
  genres: string[]
  location?: string
  eventDate?: Date
  isPaid: boolean
  isRemote: boolean
  status: 'open' | 'closed' | 'filled'
  applicantIds: Types.ObjectId[]
  isVisible: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const opportunitySchema = new mongoose.Schema<IOpportunity>(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName: { type: String, required: true, maxlength: 60 },
    avatar: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 2000 },
    lookingForRoles: [{ type: String }],
    genres: [{ type: String }],
    location: { type: String, maxlength: 100 },
    eventDate: { type: Date },
    isPaid: { type: Boolean, default: false },
    isRemote: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'closed', 'filled'], default: 'open' },
    applicantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVisible: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
)

opportunitySchema.index({ status: 1, createdAt: -1 })
opportunitySchema.index({ lookingForRoles: 1 })
opportunitySchema.index({ location: 1 })
opportunitySchema.index({ profileId: 1 })

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', opportunitySchema)
