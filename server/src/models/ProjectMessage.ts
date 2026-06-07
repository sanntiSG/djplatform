/**
 * ProjectMessage — mensaje dentro de un ProjectConversation grupal.
 * Espejo de Message, sin attachment (el chat de proyecto es texto plano + respuestas).
 */
import mongoose, { type Document, type Types } from 'mongoose'
import DOMPurify from 'isomorphic-dompurify'

export interface IProjectMessage extends Document {
  _id: Types.ObjectId
  conversationId: Types.ObjectId
  projectId: Types.ObjectId
  senderId: Types.ObjectId
  body: string
  replyTo?: Types.ObjectId
  readBy: Types.ObjectId[]
  createdAt: Date
}

const projectMessageSchema = new mongoose.Schema<IProjectMessage>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectConversation', required: true, index: true },
    projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: {
      type: String,
      required: true,
      maxlength: 2000,
      set: (v: string) => DOMPurify.sanitize(v.trim()),
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectMessage' },
    readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

projectMessageSchema.index({ conversationId: 1, createdAt: -1 })

export const ProjectMessage = mongoose.model<IProjectMessage>('ProjectMessage', projectMessageSchema)
