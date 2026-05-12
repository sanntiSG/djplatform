import { apiClient } from './apiClient.js'

export interface LocationResult {
  id: string
  name: string
  province: string
  lat?: number
  lon?: number
}

export interface ProvinceResult {
  id: string
  name: string
}

export const locationService = {
  search: (q: string) =>
    apiClient.get<LocationResult[]>(`/locations/search?q=${encodeURIComponent(q)}`),

  getProvinces: () => apiClient.get<ProvinceResult[]>('/locations/provinces'),
}
