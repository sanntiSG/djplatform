import { io as ioClient, type Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore.js'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket?.connected) return socket

  const token = useAuthStore.getState().token
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

  socket = ioClient(base, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
