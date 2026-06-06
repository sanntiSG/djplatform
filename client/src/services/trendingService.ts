import { apiClient } from './apiClient.js'
import type { TrendingResponse } from '../types/index.js'

export const trendingService = {
  get: () => apiClient.get<TrendingResponse>('/trending'),
}
