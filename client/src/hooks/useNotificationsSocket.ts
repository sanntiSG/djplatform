import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../services/socket.js'
import { useToastStore } from '../store/useToastStore.js'

type InboxData = {
  items: Array<{ _id: string; readAt: string | null }>
  unreadCount: number
  nextCursor: string | null
}

export function useNotificationsSocket() {
  const qc = useQueryClient()
  const showToast = useToastStore(s => s.show)

  useEffect(() => {
    const socket = getSocket()

    function onNew() {
      // Refetch so the new notification appears in the inbox with full actor info
      qc.invalidateQueries({ queryKey: ['notification-inbox'] })
    }

    function onRead({ id }: { id: string }) {
      qc.setQueryData<InboxData>(['notification-inbox'], (old) => {
        if (!old) return old
        const wasUnread = old.items.find((n) => n._id === id && !n.readAt)
        return {
          ...old,
          items: old.items.map((n) =>
            n._id === id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
          unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
        }
      })
    }

    function onReadAll() {
      qc.setQueryData<InboxData>(['notification-inbox'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
          unreadCount: 0,
        }
      })
    }

    function onRemoved({ id }: { id: string }) {
      qc.setQueryData<InboxData>(['notification-inbox'], (old) => {
        if (!old) return old
        const wasUnread = old.items.find((n) => n._id === id && !n.readAt)
        return {
          ...old,
          items: old.items.filter((n) => n._id !== id),
          unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
        }
      })
    }

    function onApplicationAccepted({ opportunityId, title }: { opportunityId: string; title: string; acceptedUserId: string; opportunityStatus: string }) {
      qc.invalidateQueries({ queryKey: ['opportunity', opportunityId] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['messages'] })
      showToast(`Te aceptaron en "${title}"`, 'success')
    }

    function onOpportunityClosed({ opportunityId }: { opportunityId: string; reason: string }) {
      qc.invalidateQueries({ queryKey: ['opportunity', opportunityId] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    }

    function onProjectNewApplication({ projectId, title }: { projectId: string; title: string }) {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      showToast(`Alguien quiere unirse a "${title}"`, 'success')
    }

    function onProjectApplicationAccepted({ projectId, title }: { projectId: string; title: string }) {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      showToast(`Te aceptaron en "${title}"`, 'success')
    }

    function onProjectApplicationRejected({ title }: { projectId: string; title: string }) {
      showToast(`Tu solicitud para "${title}" fue rechazada`, 'error')
    }

    socket.on('notification:new', onNew)
    socket.on('notification:read', onRead)
    socket.on('notification:read-all', onReadAll)
    socket.on('notification:removed', onRemoved)
    socket.on('opportunity:application_accepted', onApplicationAccepted)
    socket.on('opportunity:closed', onOpportunityClosed)
    socket.on('project:new_application', onProjectNewApplication)
    socket.on('project:application_accepted', onProjectApplicationAccepted)
    socket.on('project:application_rejected', onProjectApplicationRejected)

    return () => {
      socket.off('notification:new', onNew)
      socket.off('notification:read', onRead)
      socket.off('notification:read-all', onReadAll)
      socket.off('notification:removed', onRemoved)
      socket.off('opportunity:application_accepted', onApplicationAccepted)
      socket.off('opportunity:closed', onOpportunityClosed)
      socket.off('project:new_application', onProjectNewApplication)
      socket.off('project:application_accepted', onProjectApplicationAccepted)
      socket.off('project:application_rejected', onProjectApplicationRejected)
    }
  }, [qc, showToast])
}
