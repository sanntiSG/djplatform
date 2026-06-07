/**
 * ProjectConversation — una sola sala de chat grupal por proyecto.
 * A diferencia de Conversation (estrictamente 1-a-1), esta soporta N miembros.
 */
import mongoose, { type Document, type Types } from 'mongoose'

export interface IProjectConversation extends Document {
  _id: Types.ObjectId
  projectId: Types.ObjectId
  participants: Types.ObjectId[]
  lastMessageAt: Date
  lastMessagePreview: string
  lastMessageSenderId?: Types.ObjectId
  /** Contador de no-leidos por userId */
  unreadCount: Map<string, number>
  createdAt: Date
  updatedAt: Date
}

const projectConversationSchema = new mongoose.Schema<IProjectConversation>(
  {
    projectId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    participants:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt:        { type: Date, default: Date.now, index: true },
    lastMessagePreview:   { type: String, default: '' },
    lastMessageSenderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unreadCount:          { type: Map, of: Number, default: new Map() },
  },
  { timestamps: true },
)

projectConversationSchema.index({ participants: 1, lastMessageAt: -1 })

export const ProjectConversation = mongoose.model<IProjectConversation>(
  'ProjectConversation',
  projectConversationSchema,
)
