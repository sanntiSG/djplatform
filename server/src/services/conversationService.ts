import mongoose from 'mongoose'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'
import { Profile } from '../models/Profile.js'
import { User } from '../models/User.js'

export async function findOrCreateConversation(userAId: string, userBId: string) {
  const [a, b] = [userAId, userBId].sort()
  let conv = await Conversation.findOne({
    participants: { $all: [new mongoose.Types.ObjectId(a), new mongoose.Types.ObjectId(b)] },
  })
  if (!conv) {
    conv = await Conversation.create({
      participants: [new mongoose.Types.ObjectId(a), new mongoose.Types.ObjectId(b)],
      unreadCount: new Map(),
    })
  }
  return conv
}

export async function listConversationsForUser(userId: string) {
  const convs = await Conversation.find({
    participants: new mongoose.Types.ObjectId(userId),
  }).sort({ lastMessageAt: -1 }).lean()

  const enriched = await Promise.all(
    convs.map(async conv => {
      const otherId = conv.participants.find(p => p.toString() !== userId)
      if (!otherId) return null

      const otherUser = await User.findById(otherId).lean()
      const otherProfile = otherUser?.profileId
        ? await Profile.findById(otherUser.profileId).select('artistName avatar slug').lean()
        : null

      const myUnread = conv.unreadCount instanceof Map
        ? conv.unreadCount.get(userId) ?? 0
        : (conv.unreadCount as Record<string, number>)[userId] ?? 0

      return {
        _id: conv._id,
        otherUser: {
          _id: otherId,
          artistName: otherProfile?.artistName ?? (otherUser?.email.split('@')[0] ?? 'Usuario'),
          avatar: otherProfile?.avatar ?? null,
          slug: (otherProfile as unknown as { slug?: string })?.slug ?? null,
          profileId: otherUser?.profileId ?? null,
        },
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        lastMessageSenderId: conv.lastMessageSenderId,
        unreadCount: myUnread,
      }
    }),
  )

  return enriched.filter(Boolean)
}

export async function getMessages(conversationId: string, before?: string, limit = 40) {
  const query: Record<string, unknown> = { conversationId: new mongoose.Types.ObjectId(conversationId) }
  if (before) {
    const beforeMsg = await Message.findById(before).lean()
    if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return messages.reverse()
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  replyTo?: string,
) {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw new Error('Conversacion no encontrada')

  const isParticipant = conv.participants.some(p => p.toString() === senderId)
  if (!isParticipant) throw new Error('No eres participante de esta conversacion')

  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderId: new mongoose.Types.ObjectId(senderId),
    body,
    replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
    readBy: [new mongoose.Types.ObjectId(senderId)],
  })

  const recipientId = conv.participants.find(p => p.toString() !== senderId)?.toString()

  // Update conversation metadata
  const update: Record<string, unknown> = {
    lastMessageAt: message.createdAt,
    lastMessagePreview: body.slice(0, 80),
    lastMessageSenderId: new mongoose.Types.ObjectId(senderId),
  }
  if (recipientId) {
    const currentUnread = (conv.unreadCount instanceof Map
      ? conv.unreadCount.get(recipientId)
      : (conv.unreadCount as Record<string, number>)[recipientId]) ?? 0
    update[`unreadCount.${recipientId}`] = currentUnread + 1
  }
  await Conversation.findByIdAndUpdate(conversationId, { $set: update })

  return { message, recipientId }
}

export async function markConversationRead(conversationId: string, userId: string) {
  await Message.updateMany(
    { conversationId: new mongoose.Types.ObjectId(conversationId), readBy: { $ne: new mongoose.Types.ObjectId(userId) } },
    { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
  )
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  })
}

export async function getTotalUnread(userId: string): Promise<number> {
  const convs = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) }).lean()
  let total = 0
  for (const conv of convs) {
    const n = conv.unreadCount instanceof Map
      ? conv.unreadCount.get(userId)
      : (conv.unreadCount as Record<string, number>)[userId]
    total += n ?? 0
  }
  return total
}
