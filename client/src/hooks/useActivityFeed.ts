import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityService, type ActivityEvent } from '../services/activityService.js'
import { getSocket } from '../services/socket.js'

export function useActivityFeed(limit = 20) {
  const qc = useQueryClient()

  // Listen for real-time activity events from the server
  useEffect(() => {
    const socket = getSocket()

    function onActivityNew(item: ActivityEvent) {
      qc.setQueryData<ActivityEvent[]>(['activity-feed', limit], old => {
        if (!old) return [item]
        // Avoid duplicate
        if (old.some(a => a.id === item.id)) return old
        // Prepend and keep within limit
        return [item, ...old].slice(0, limit)
      })
    }

    socket.on('activity:new', onActivityNew)
    return () => {
      socket.off('activity:new', onActivityNew)
    }
  }, [qc, limit])

  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: () => activityService.list(limit),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
