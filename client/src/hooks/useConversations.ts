import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsService } from '../services/conversationsService.js'
import { useNavigate } from 'react-router-dom'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.list(),
    refetchInterval: 30_000,
  })
}

export function useStartConversation() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (targetUserId: string) => conversationsService.start(targetUserId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/me/mensajes/${conv._id}`)
    },
  })
}

export function useConversationUnread() {
  return useQuery({
    queryKey: ['conversations-unread'],
    queryFn: () => conversationsService.getUnreadTotal(),
    refetchInterval: 30_000,
  })
}
