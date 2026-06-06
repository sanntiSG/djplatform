import mongoose, { type Document, type Types } from 'mongoose'

export interface IProjectMember extends Document {
  _id: Types.ObjectId
  projectId: Types.ObjectId
  profileId: Types.ObjectId
  userId: Types.ObjectId
  role: string
  status: 'pending' | 'member' | 'rejected'
  isCreator: boolean
  joinedAt?: Date
  createdAt: Date
}

const projectMemberSchema = new mongoose.Schema<IProjectMember>(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role:      { type: String, maxlength: 40, default: '' },
    status:    { type: String, enum: ['pending', 'member', 'rejected'], default: 'pending' },
    isCreator: { type: Boolean, default: false },
    joinedAt:  { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// Un perfil puede tener solo una entrada por proyecto
projectMemberSchema.index({ projectId: 1, profileId: 1 }, { unique: true })
projectMemberSchema.index({ projectId: 1, status: 1 })
projectMemberSchema.index({ userId: 1, status: 1 })

export const ProjectMember = mongoose.model<IProjectMember>('ProjectMember', projectMemberSchema)
