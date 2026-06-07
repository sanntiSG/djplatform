import type { Request, Response } from 'express'
import { User } from '../models/User.js'
import {
  findOrCreateConversation,
  listConversationsForUser,
  getMessages,
  sendMessage,
  markConversationRead,
  getTotalUnread,
} from '../services/conversationService.js'
import { listProjectConversationsForUser, getTotalProjectUnread } from '../services/projectChatService.js'
import { create as createNotification, markChatNotificationsRead } from '../services/notificationService.js'
import { io, isUserViewingConversation } from '../realtime/io.js'
import { logger } from '../utils/logger.js'

export async function startConversation(req: Request, res: Response) {
  const senderId = req.user!.id
  const { targetUserId } = req.body as { targetUserId?: string }
  if (!targetUserId) return res.status(400).json({ message: 'targetUserId requerido' })

  const targetUser = await User.findById(targetUserId)
  if (!targetUser) return res.status(404).json({ message: 'Usuario no encontrado' })

  const conv = await findOrCreateConversation(senderId, targetUserId)
  return res.json(conv)
}

export async function listConversations(req: Request, res: Response) {
  const userId = req.user!.id
  const [dmConvs, projectConvs] = await Promise.all([
    listConversationsForUser(userId),
    listProjectConversationsForUser(userId),
  ])

  // Agregar discriminador type:'dm' a los DMs
  const dmItems = dmConvs.map((c) => ({ ...c, type: 'dm' as const }))

  // Merge ordenado por lastMessageAt desc
  const all = [...dmItems, ...projectConvs].sort((a, b) => {
    const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return tB - tA
  })

  return res.json(all)
}

export async function getConversationMessages(req: Request, res: Response) {
  const userId = req.user!.id
  const { id } = req.params
  const before = req.query.before as string | undefined
  const limit = Number(req.query.limit ?? 40)

  const messages = await getMessages(id, before, Math.min(limit, 100))
  return res.json(messages)
}

export async function postMessage(req: Request, res: Response) {
  const senderId = req.user!.id
  const { id: conversationId } = req.params
  const { body, replyTo } = req.body as { body?: string; replyTo?: string }

  if (!body?.trim()) return res.status(400).json({ message: 'El mensaje no puede estar vacio' })

  const { message, recipientId } = await sendMessage(conversationId, senderId, body.trim(), replyTo)

  // Emit to both participants in real time
  io.to(`user:${senderId}`).emit('message:new', { conversationId, message })
  if (recipientId) {
    io.to(`user:${recipientId}`).emit('message:new', { conversationId, message })

    // Notification only if recipient is NOT currently viewing this conversation
    if (!isUserViewingConversation(recipientId, conversationId)) {
      createNotification(recipientId, 'chat_message_new', {
        actorId: senderId,
        payload: { conversationId, preview: body.slice(0, 80) },
        url: `/me/mensajes/${conversationId}`,
      }).catch((err: unknown) => logger.error('Error creando notif de chat', err))
    }
  }

  return res.status(201).json(message)
}

export async function readConversation(req: Request, res: Response) {
  const userId = req.user!.id
  const { id: conversationId } = req.params

  await markConversationRead(conversationId, userId)
  io.to(`user:${userId}`).emit('conversation:read', { conversationId })

  // Auto-clear chat notifications for this conversation
  markChatNotificationsRead(userId, conversationId).catch(() => {})

  return res.json({ ok: true })
}

export async function getUnreadTotal(req: Request, res: Response) {
  const userId = req.user!.id
  const [dmTotal, projectTotal] = await Promise.all([
    getTotalUnread(userId),
    getTotalProjectUnread(userId),
  ])
  return res.json({ total: dmTotal + projectTotal })
}
