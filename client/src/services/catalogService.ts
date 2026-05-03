import { apiClient } from './apiClient.js'
import type { CatalogItem } from '../types/index.js'

export const catalogService = {
  getGenres: () => apiClient.get<CatalogItem[]>('/catalogs/genres'),
  getEventTypes: () => apiClient.get<CatalogItem[]>('/catalogs/event-types'),
}
