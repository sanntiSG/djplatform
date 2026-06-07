import mongoose, { type Document, type Types } from 'mongoose'
import DOMPurify from 'isomorphic-dompurify'

export interface IMessageAttachmentOpportunity {
  type: 'opportunity'
  opportunityId: string
  title: string
  cover?: string
  status: 'open' | 'closed' | 'filled'
}

export interface IMessageAttachmentProject {
  type: 'project'
  projectId: string
  title: string
  cover?: string
  applicantProfileId: string
}

export type IMessageAttachment = IMessageAttachmentOpportunity | IMessageAttachmentProject

export interface IMessage extends Document {
  _id: Types.ObjectId
  conversationId: Types.ObjectId
  senderId: Types.ObjectId
  body: string
  replyTo?: Types.ObjectId
  readBy: Types.ObjectId[]
  attachment?: IMessageAttachment
  createdAt: Date
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: {
      type: String,
      required: true,
      maxlength: 2000,
      set: (v: string) => DOMPurify.sanitize(v.trim()),
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachment: {
      type: {
        type: String,
        enum: ['opportunity', 'project'],
      },
      // opportunity fields
      opportunityId: String,
      status: { type: String, enum: ['open', 'closed', 'filled'] },
      // project fields
      projectId: String,
      applicantProfileId: String,
      // shared
      title: String,
      cover: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const Message = mongoose.model<IMessage>('Message', messageSchema)
