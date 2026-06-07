import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { ProjectMember } from '../models/ProjectMember.js'
import { Project } from '../models/Project.js'
import { parseObjectId } from '../utils/parseId.js'
import {
  getOrCreateProjectConversation,
  getProjectMessages,
  sendProjectMessage,
  markProjectConversationRead,
  enrichProjectMessages,
} from '../services/projectChatService.js'
import { create as createNotification } from '../services/notificationService.js'
import { io } from '../realtime/io.js'
import { logger } from '../utils/logger.js'

const SendMessageSchema = z.object({
  body:    z.string().min(1).max(2000),
  replyTo: z.string().optional(),
})

/** Verifica que el usuario sea miembro activo del proyecto */
async function requireMembership(projectId: string, userId: string) {
  const member = await ProjectMember.findOne({
    projectId: new mongoose.Types.ObjectId(projectId),
    userId:    userId,
    status:    'member',
  }).lean()
  return Boolean(member)
}

/** GET /:id/chat/messages — listar mensajes (solo miembros) */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseObjectId(req.params.id)
    if (!await requireMembership(projectId, req.user!.id)) {
      res.status(403).json({ error: 'Solo los miembros pueden ver el chat' })
      return
    }

    const conv = await getOrCreateProjectConversation(projectId)
    const before = typeof req.query.before === 'string' ? req.query.before : undefined
    const raw    = await getProjectMessages(conv._id.toString(), before, 40)
    const msgs   = await enrichProjectMessages(raw)

    res.json({ conversationId: conv._id.toString(), messages: msgs })
  } catch (err) {
    next(err)
  }
}

/** POST /:id/chat/messages — enviar mensaje (solo miembros) */
export async function postMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseObjectId(req.params.id)
    if (!await requireMembership(projectId, req.user!.id)) {
      res.status(403).json({ error: 'Solo los miembros pueden enviar mensajes' })
      return
    }

    const { body, replyTo } = SendMessageSchema.parse(req.body)
    const conv = await getOrCreateProjectConversation(projectId)
    const convId = conv._id.toString()

    const { message, recipientIds } = await sendProjectMessage(convId, projectId, req.user!.id, body, replyTo)
    const [enriched] = await enrichProjectMessages([message as any])

    // Emitir en tiempo real a todos los participantes
    const eventPayload = { conversationId: convId, projectId, message: enriched }
    io.to(`user:${req.user!.id}`).emit('project:message:new', eventPayload)
    recipientIds.forEach((rid) => {
      io.to(`user:${rid}`).emit('project:message:new', eventPayload)
    })

    // Notificar a los que no están viendo el chat
    const project = await Project.findById(projectId).select('title').lean()
    recipientIds.forEach((rid) => {
      const isViewing = [...(io.sockets.adapter.rooms.get(`conv:project:${convId}`) ?? [])].some((sid) => {
        const s = io.sockets.sockets.get(sid)
        return s && (s as any).data?.userId === rid
      })
      if (!isViewing) {
        createNotification(rid, 'chat_message_new', {
          actorId: req.user!.id,
          payload: { preview: body.slice(0, 80), title: project?.title ?? '' },
          url:     `/proyectos/${projectId}?tab=chat`,
        }).catch((err: unknown) => logger.error('project chat notif error', err))
      }
    })

    res.status(201).json(enriched)
  } catch (err) {
    next(err)
  }
}

/** PATCH /:id/chat/read — marcar como leido */
export async function readMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseObjectId(req.params.id)
    if (!await requireMembership(projectId, req.user!.id)) {
      res.status(403).json({ error: 'Sin permisos' })
      return
    }

    const conv = await getOrCreateProjectConversation(projectId)
    await markProjectConversationRead(conv._id.toString(), req.user!.id)

    io.to(`user:${req.user!.id}`).emit('project:conversation:read', {
      conversationId: conv._id.toString(),
      projectId,
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
