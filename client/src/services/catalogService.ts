import { apiClient } from './apiClient.js'
import type { CatalogItem } from '../types/index.js'

export interface AdminGenreItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  order: number
}

export const catalogService = {
  getGenres: () => apiClient.get<CatalogItem[]>('/catalogs/genres'),
  getEventTypes: () => apiClient.get<CatalogItem[]>('/catalogs/event-types'),

  // Admin-only
  adminListGenres: () => apiClient.get<AdminGenreItem[]>('/admin/genres'),
  adminCreateGenre: (name: string) => apiClient.post<AdminGenreItem>('/admin/genres', { name }),
  adminUpdateGenre: (id: string, patch: { isActive?: boolean; name?: string }) =>
    apiClient.patch<AdminGenreItem>(`/admin/genres/${id}`, patch),
  adminDeleteGenre: (id: string) => apiClient.delete<void>(`/admin/genres/${id}`),
}
