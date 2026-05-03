import { useQuery } from '@tanstack/react-query'
import { catalogService } from '../services/catalogService.js'

const STALE_TIME = 1000 * 60 * 60 // 1h

export function useCatalogs() {
  const genres = useQuery({
    queryKey: ['catalogs', 'genres'],
    queryFn: catalogService.getGenres,
    staleTime: STALE_TIME,
  })

  const eventTypes = useQuery({
    queryKey: ['catalogs', 'event-types'],
    queryFn: catalogService.getEventTypes,
    staleTime: STALE_TIME,
  })

  return { genres, eventTypes }
}
