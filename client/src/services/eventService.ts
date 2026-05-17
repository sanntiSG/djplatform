import { apiClient } from './apiClient.js'
import type { EventResponse, CreateEventInput, UpdateEventInput } from '../types/index.js'

export interface EventAttendee {
  id: string
  artistName: string
  avatar?: string
  slug: string
}

export const eventService = {
  create: (data: CreateEventInput) => apiClient.post<EventResponse>('/events', data),
  update: (id: string, data: UpdateEventInput) =>
    apiClient.patch<EventResponse>(`/events/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/events/${id}`),
  getById: (id: string) => apiClient.get<EventResponse>(`/events/${id}`),
  feed: (cursor?: string, limit = 20) => {
    const qs = new URLSearchParams({ limit: String(limit) })
    if (cursor) qs.set('cursor', cursor)
    return apiClient.get<EventResponse[]>(`/events?${qs.toString()}`)
  },
  listByProfile: (profileId: string) =>
    apiClient.get<EventResponse[]>(`/profiles/${profileId}/events`),
  listAttendees: (eventId: string) =>
    apiClient.get<EventAttendee[]>(`/events/${eventId}/attendees`),
}
