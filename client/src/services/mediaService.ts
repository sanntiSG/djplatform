import { apiClient } from './apiClient.js'
import type { MediaResolveOutput } from '../types/index.js'

export const mediaService = {
  resolve: (url: string) => apiClient.post<MediaResolveOutput>('/media/resolve', { url }),
}
