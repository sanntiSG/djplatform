import { apiClient } from './apiClient.js'
import type { ProjectResponse, CreateProjectInput, UpdateProjectInput, ApplyProjectInput } from '../types/index.js'

export interface ProjectProgressResponse {
  id: string
  projectId: string
  projectTitle: string
  artistName: string
  artistSlug: string
  phase: string
  svgKey: string
  message?: string
  publishedToFeed: boolean
  publishedToProfile: boolean
  expiresAt?: string
  memberShareEnabled?: boolean
  createdAt?: string
}

export interface PublishProgressInput {
  svgKey: string
  message?: string
  publishedToFeed: boolean
  publishedToProfile: boolean
}

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

  // Progress publishing
  publishProgress: (projectId: string, data: PublishProgressInput) =>
    apiClient.post<ProjectProgressResponse>(`/projects/${projectId}/progress`, data),

  deleteProgress: (projectId: string, postId: string) =>
    apiClient.delete<void>(`/projects/${projectId}/progress/${postId}`),

  memberShareProgress: (projectId: string, postId: string) =>
    apiClient.post<{ ok: boolean }>(`/projects/${projectId}/progress/${postId}/share`, {}),

  // Progress feed for MainFeed section
  getProgressFeed: () =>
    apiClient.get<ProjectProgressResponse[]>('/projects/progress-feed'),

  // Complete project
  completeProject: (projectId: string) =>
    apiClient.post<{ id: string; ok: boolean }>(`/projects/${projectId}/complete`, {}),
}
