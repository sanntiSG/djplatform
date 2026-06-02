import { apiClient } from './apiClient.js'
import type { AuthResponse, RegisterInput, LoginInput, UserResponse, ChangePasswordInput } from '../types/index.js'

export const authService = {
  register: (data: RegisterInput) => apiClient.post<AuthResponse>('/auth/register', data),
  login: (data: LoginInput) => apiClient.post<AuthResponse>('/auth/login', data),
  googleAuth: (credential: string) => apiClient.post<AuthResponse>('/auth/google', { credential }),
  me: () => apiClient.get<UserResponse>('/auth/me'),
  changePassword: (data: ChangePasswordInput) =>
    apiClient.post<AuthResponse>('/auth/change-password', data),
  deleteAccount: () => apiClient.delete<{ message: string }>('/auth/me'),
}
