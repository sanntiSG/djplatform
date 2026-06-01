import mongoose from 'mongoose'
import { Conversation } from '../models/Conversation.js'
import { Message, type IMessageAttachment } from '../models/Message.js'
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

export async function listConversationsForUser(userId: string, limit = 50) {
  // Limite para no traer miles de conversaciones de una sola vez
  const convs = await Conversation.find({
    participants: new mongoose.Types.ObjectId(userId),
  }).sort({ lastMessageAt: -1 }).limit(limit).lean()

  if (!convs.length) return []

  // --- Fix N+1: antes era 1 + 2*N queries; ahora son exactamente 3 ---
  const otherIds = convs
    .map(conv => conv.participants.find(p => p.toString() !== userId))
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id))

  // 1 query: todos los usuarios contrarios
  const users = await User.find({ _id: { $in: otherIds } }).select('_id email profileId').lean()
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  // 2 query: todos los perfiles de esos usuarios
  const profileIds = users.map(u => u.profileId).filter(Boolean)
  const profiles = await Profile.find({ _id: { $in: profileIds } }).select('artistName avatar slug userId').lean()
  const profileByUserId = new Map(profiles.map(p => [p.userId.toString(), p]))

  // Mapear en memoria — sin queries adicionales
  const enriched = convs.map(conv => {
    const otherId = conv.participants.find(p => p.toString() !== userId)
    if (!otherId) return null

    const otherUser = userMap.get(otherId.toString())
    const otherProfile = otherUser ? profileByUserId.get(otherUser._id.toString()) : null

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
  })

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
  attachment?: IMessageAttachment,
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
    attachment,
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
  // Projection para no traer todos los campos de la conversacion
  const convs = await Conversation.find(
    { participants: new mongoose.Types.ObjectId(userId) },
    { unreadCount: 1 },
  ).lean()
  let total = 0
  for (const conv of convs) {
    const n = conv.unreadCount instanceof Map
      ? conv.unreadCount.get(userId)
      : (conv.unreadCount as Record<string, number>)[userId]
    total += n ?? 0
  }
  return total
}
