import mongoose, { type Document, type Types } from 'mongoose'

export interface IConversation extends Document {
  _id: Types.ObjectId
  participants: [Types.ObjectId, Types.ObjectId]
  lastMessageAt: Date
  lastMessagePreview: string
  lastMessageSenderId?: Types.ObjectId
  unreadCount: Map<string, number>
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: { validator: (v: unknown[]) => v.length === 2, message: 'Debe tener exactamente 2 participantes' },
    },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '' },
    lastMessageSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    unreadCount: { type: Map, of: Number, default: new Map() },
  },
  { timestamps: true },
)

// Unique pair regardless of order
conversationSchema.index(
  { 'participants.0': 1, 'participants.1': 1 },
  { unique: true },
)

// Indice multikey para buscar conversaciones por usuario (listConversationsForUser / getTotalUnread)
// Sin este indice, cada consulta hace collection scan sobre todos los docs
conversationSchema.index({ participants: 1, lastMessageAt: -1 })

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema)
