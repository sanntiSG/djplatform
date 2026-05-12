import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
import { env } from '../config/env.js'

export let io: Server

// userId -> Set of conversationIds they're currently viewing
export const viewingMap = new Map<string, Set<string>>()

export function initIO(httpServer: HttpServer): Server {
  const allowedOrigins = env.CLIENT_URL.split(',').map(o => o.trim())

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = verifyToken(token)
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', socket => {
    const userId = socket.data.userId as string
    void socket.join(`user:${userId}`)

    socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', { userId, conversationId })
    })

    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { userId, conversationId })
    })

    socket.on('presence:viewing', ({ conversationId }: { conversationId: string }) => {
      if (!viewingMap.has(userId)) viewingMap.set(userId, new Set())
      viewingMap.get(userId)!.add(conversationId)
      void socket.join(`conv:${conversationId}`)
    })

    socket.on('presence:leave', ({ conversationId }: { conversationId: string }) => {
      viewingMap.get(userId)?.delete(conversationId)
      void socket.leave(`conv:${conversationId}`)
    })

    socket.on('disconnect', () => {
      viewingMap.delete(userId)
    })
  })

  return io
}

export function isUserViewingConversation(userId: string, conversationId: string): boolean {
  return viewingMap.get(userId)?.has(conversationId) ?? false
}
