import { io as ioClient, type Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore.js'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket

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

// Auto-desconectar cuando el usuario cierra sesion, para que el proximo login
// cree un socket nuevo con el JWT actualizado. Los componentes de listeners
// se desmontan con el usuario y se remontan al re-loguear, re-creando getSocket().
useAuthStore.subscribe((state, prevState) => {
  if (prevState.token && !state.token) {
    disconnectSocket()
  }
})
