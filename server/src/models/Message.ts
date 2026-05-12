import mongoose, { type Document, type Types } from 'mongoose'
import DOMPurify from 'isomorphic-dompurify'

export interface IMessage extends Document {
  _id: Types.ObjectId
  conversationId: Types.ObjectId
  senderId: Types.ObjectId
  body: string
  replyTo?: Types.ObjectId
  readBy: Types.ObjectId[]
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const Message = mongoose.model<IMessage>('Message', messageSchema)
