import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import type { ReactNode } from 'react'

interface RequireAuthProps {
  children: ReactNode
  adminOnly?: boolean
}

export function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { token, user } = useAuthStore()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
