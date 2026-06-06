import { apiClient } from './apiClient.js'
import type { ProjectResponse, CreateProjectInput, UpdateProjectInput, ApplyProjectInput } from '../types/index.js'

export const projectService = {
  list: (params?: { phase?: string; role?: string; genre?: string; status?: string; cursor?: string }) => {
    const q = new URLSearchParams()
    if (params?.phase)  q.set('phase',  params.phase)
    if (params?.role)   q.set('role',   params.role)
    if (params?.genre)  q.set('genre',  params.genre)
    if (params?.status) q.set('status', params.status)
    if (params?.cursor) q.set('cursor', params.cursor)
    const qs = q.toString()
    return apiClient.get<ProjectResponse[]>(`/projects${qs ? `?${qs}` : ''}`)
  },

  forMe: (limit = 6) =>
    apiClient.get<ProjectResponse[]>(`/projects/for-me?limit=${limit}`),

  mine: () => apiClient.get<ProjectResponse[]>('/projects/mine'),

  getById: (id: string) => apiClient.get<ProjectResponse>(`/projects/${id}`),

  create: (data: CreateProjectInput) =>
    apiClient.post<ProjectResponse>('/projects', data),

  update: (id: string, data: UpdateProjectInput) =>
    apiClient.patch<ProjectResponse>(`/projects/${id}`, data),

  remove: (id: string) => apiClient.delete<void>(`/projects/${id}`),

  apply: (id: string, data: ApplyProjectInput) =>
    apiClient.post<{ conversationId: string }>(`/projects/${id}/apply`, data),

  cancelApply: (id: string) => apiClient.delete<void>(`/projects/${id}/apply`),

  acceptMember: (projectId: string, memberId: string) =>
    apiClient.post<{ ok: boolean }>(`/projects/${projectId}/accept/${memberId}`, {}),

  removeMember: (projectId: string, memberId: string) =>
    apiClient.delete<void>(`/projects/${projectId}/members/${memberId}`),
}
