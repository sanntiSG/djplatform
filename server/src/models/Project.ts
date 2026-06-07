import mongoose, { type Document, type Types } from 'mongoose'
import type { ProjectPhase } from '@dj/shared'

export interface IProject extends Document {
  _id: Types.ObjectId
  profileId: Types.ObjectId
  userId: Types.ObjectId
  artistName: string
  avatar?: string
  artistSlug: string
  title: string
  description?: string
  cover?: string
  coverSvgKey?: string
  genres: string[]
  location?: string
  lookingForRoles: string[]
  phase: ProjectPhase
  status: 'open' | 'closed'
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    profileId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName:      { type: String, required: true, maxlength: 60 },
    avatar:          { type: String },
    artistSlug:      { type: String, required: true },
    title:           { type: String, required: true, trim: true, maxlength: 120 },
    description:     { type: String, maxlength: 2000 },
    cover:           { type: String },
    coverSvgKey:     { type: String },
    genres:          [{ type: String }],
    location:        { type: String, maxlength: 100 },
    lookingForRoles: [{ type: String }],
    phase:           { type: String, enum: ['idea', 'progress', 'recording', 'mixing', 'released'], default: 'idea' },
    status:          { type: String, enum: ['open', 'closed'], default: 'open' },
    isVisible:       { type: Boolean, default: true },
  },
  { timestamps: true },
)

projectSchema.index({ status: 1, createdAt: -1 })
projectSchema.index({ lookingForRoles: 1 })
projectSchema.index({ genres: 1 })
projectSchema.index({ profileId: 1 })
projectSchema.index({ isVisible: 1, status: 1 })

export const Project = mongoose.model<IProject>('Project', projectSchema)
