/**
 * projectChatService — lógica de negocio del chat grupal por proyecto.
 * Espejo de conversationService, adaptado para N participantes.
 */
import mongoose from 'mongoose'
import { ProjectConversation } from '../models/ProjectConversation.js'
import { ProjectMessage } from '../models/ProjectMessage.js'
import { ProjectMember } from '../models/ProjectMember.js'
import { Profile } from '../models/Profile.js'
import { User } from '../models/User.js'

/** Obtiene o crea la ProjectConversation del proyecto, sincronizando participantes con los miembros activos */
export async function getOrCreateProjectConversation(projectId: string) {
  let conv = await ProjectConversation.findOne({ projectId: new mongoose.Types.ObjectId(projectId) })

  // Obtener miembros activos (incluye creador)
  const members = await ProjectMember.find({
    projectId: new mongoose.Types.ObjectId(projectId),
    status:    'member',
  }).lean()

  const memberUserIds = members.map((m) => m.userId)

  if (!conv) {
    conv = await ProjectConversation.create({
      projectId:    new mongoose.Types.ObjectId(projectId),
      participants: memberUserIds,
      unreadCount:  new Map(),
    })
  } else {
    // Sincronizar participantes: agregar nuevos miembros que no estén en la lista
    const existingIds = conv.participants.map((p) => p.toString())
    const newIds = memberUserIds.filter((id) => !existingIds.includes(id.toString()))
    if (newIds.length) {
      await ProjectConversation.updateOne(
        { _id: conv._id },
        { $addToSet: { participants: { $each: newIds } } },
      )
      conv = await ProjectConversation.findById(conv._id) as NonNullable<typeof conv>
    }
  }

  return conv
}

/** Devuelve los mensajes paginados por cursor (más antiguos primero) */
export async function getProjectMessages(conversationId: string, before?: string, limit = 40) {
  const query: Record<string, unknown> = {
    conversationId: new mongoose.Types.ObjectId(conversationId),
  }
  if (before) {
    const beforeMsg = await ProjectMessage.findById(before).lean()
    if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt }
  }

  const messages = await ProjectMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return messages.reverse()
}

/** Envía un mensaje y actualiza metadata de la conversación */
export async function sendProjectMessage(
  conversationId: string,
  projectId: string,
  senderId: string,
  body: string,
  replyTo?: string,
) {
  const conv = await ProjectConversation.findById(conversationId)
  if (!conv) throw new Error('Conversacion de proyecto no encontrada')

  const isMember = conv.participants.some((p) => p.toString() === senderId)
  if (!isMember) throw new Error('No sos miembro de este proyecto')

  const message = await ProjectMessage.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    projectId:      new mongoose.Types.ObjectId(projectId),
    senderId:       new mongoose.Types.ObjectId(senderId),
    body,
    replyTo:        replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
    readBy:         [new mongoose.Types.ObjectId(senderId)],
  })

  // Actualizar metadata e incrementar unreadCount de todos los demás participantes
  const update: Record<string, unknown> = {
    lastMessageAt:       message.createdAt,
    lastMessagePreview:  body.slice(0, 80),
    lastMessageSenderId: new mongoose.Types.ObjectId(senderId),
  }

  const recipients = conv.participants.filter((p) => p.toString() !== senderId)
  for (const r of recipients) {
    const rid = r.toString()
    const current = (conv.unreadCount instanceof Map
      ? conv.unreadCount.get(rid)
      : (conv.unreadCount as Record<string, number>)[rid]) ?? 0
    update[`unreadCount.${rid}`] = current + 1
  }

  await ProjectConversation.findByIdAndUpdate(conversationId, { $set: update })

  return { message, recipientIds: recipients.map((r) => r.toString()) }
}

/** Marca todos los mensajes no-leídos del usuario como leídos */
export async function markProjectConversationRead(conversationId: string, userId: string) {
  await ProjectMessage.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      readBy:         { $ne: new mongoose.Types.ObjectId(userId) },
    },
    { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
  )
  await ProjectConversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  })
}

/** Suma total de no-leídos en chats de proyectos para el usuario */
export async function getTotalProjectUnread(userId: string): Promise<number> {
  const convs = await ProjectConversation.find({
    participants: new mongoose.Types.ObjectId(userId),
  }).select('unreadCount').lean()

  return convs.reduce((sum, c) => {
    const n = (c.unreadCount instanceof Map
      ? c.unreadCount.get(userId)
      : (c.unreadCount as Record<string, number>)[userId]) ?? 0
    return sum + n
  }, 0)
}

/** Enriquece los mensajes con info del sender (artistName, avatar) */
export async function enrichProjectMessages(messages: Awaited<ReturnType<typeof getProjectMessages>>) {
  if (!messages.length) return []

  const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))]
  const users = await User.find({ _id: { $in: senderIds } }).select('_id profileId').lean()
  const profileIds = users.map((u) => u.profileId).filter(Boolean)
  const profiles = await Profile.find({ _id: { $in: profileIds } })
    .select('artistName avatar slug userId')
    .lean()

  const profileByUserId = new Map(profiles.map((p) => [p.userId.toString(), p]))
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  return messages.map((msg) => {
    const user    = userMap.get(msg.senderId.toString())
    const profile = user ? profileByUserId.get(user._id.toString()) : null
    return {
      _id:            msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      projectId:      msg.projectId.toString(),
      senderId:       msg.senderId.toString(),
      senderName:     profile?.artistName ?? 'Usuario',
      senderAvatar:   profile?.avatar ?? null,
      body:           msg.body,
      replyTo:        msg.replyTo?.toString() ?? null,
      readBy:         msg.readBy.map((id) => id.toString()),
      createdAt:      (msg as any).createdAt?.toISOString() ?? new Date().toISOString(),
    }
  })
}
