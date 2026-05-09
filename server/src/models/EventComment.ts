import mongoose, { type Document, type Types } from 'mongoose'

export interface IEventComment extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  eventId: Types.ObjectId
  parentId?: Types.ObjectId
  userEmail: string
  text: string
  likedBy: Types.ObjectId[]
  likeCount: number
  editedAt?: Date
  createdAt: Date
}

const schema = new mongoose.Schema<IEventComment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventComment', default: null },
    userEmail: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    editedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

schema.index({ eventId: 1, parentId: 1, createdAt: -1 })
schema.index({ userId: 1 })

export const EventComment = mongoose.model<IEventComment>('EventComment', schema)
