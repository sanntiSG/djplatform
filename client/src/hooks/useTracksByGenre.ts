import { useQuery } from '@tanstack/react-query'
import { mediaService } from '../services/mediaService.js'

export function useTracksByGenre(slug: string) {
  return useQuery({
    queryKey: ['tracks', 'by-genre', slug],
    queryFn: () => mediaService.tracksByGenre(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
  })
}
