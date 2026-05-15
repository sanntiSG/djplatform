import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsService } from '../services/conversationsService.js'
import { useNavigate } from 'react-router-dom'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.list(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    // Socket invalidates in real time; this is a fallback for missed reconnects
    refetchInterval: 5 * 60_000,
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
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    // Socket keeps this in sync; fallback for missed reconnects only
    refetchInterval: 5 * 60_000,
  })
}
