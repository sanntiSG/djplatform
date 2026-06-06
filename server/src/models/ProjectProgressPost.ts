import mongoose, { type Document, type Types } from 'mongoose'
import type { ProjectPhase } from '@dj/shared'

export interface IProjectProgressPost extends Document {
  _id: Types.ObjectId
  projectId: Types.ObjectId
  creatorProfileId: Types.ObjectId
  creatorUserId: Types.ObjectId
  projectTitle: string
  artistName: string
  artistSlug: string
  phase: ProjectPhase
  svgKey: string
  message?: string
  publishedToFeed: boolean
  publishedToProfile: boolean
  memberShareEnabled: boolean
  memberSharedBy: Types.ObjectId[]
  isCompletion: boolean
  expiresAt?: Date
  createdAt: Date
}

const schema = new mongoose.Schema<IProjectProgressPost>(
  {
    projectId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    creatorProfileId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    creatorUserId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectTitle:      { type: String, required: true, maxlength: 120 },
    artistName:        { type: String, required: true, maxlength: 60 },
    artistSlug:        { type: String, required: true },
    phase:             { type: String, enum: ['idea', 'progress', 'recording', 'mixing', 'released'], required: true },
    svgKey:            { type: String, required: true, maxlength: 30 },
    message:           { type: String, maxlength: 280 },
    publishedToFeed:    { type: Boolean, default: false },
    publishedToProfile: { type: Boolean, default: false },
    memberShareEnabled: { type: Boolean, default: false },
    memberSharedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
    isCompletion:      { type: Boolean, default: false },
    expiresAt:         { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// TTL: Mongo borra automaticamente cuando expiresAt < now (expireAfterSeconds:0)
// Los posts de isCompletion=true no tienen expiresAt, no se borran solos.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { isCompletion: false } })
schema.index({ projectId: 1, createdAt: -1 })
schema.index({ publishedToFeed: 1, expiresAt: 1 })
schema.index({ creatorProfileId: 1 })

export const ProjectProgressPost = mongoose.model<IProjectProgressPost>('ProjectProgressPost', schema)
