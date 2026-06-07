const BASE = import.meta.env.VITE_API_URL ?? '/api'

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-store')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string } }
    return parsed.state?.token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  const data = (await res.json()) as T & { error?: string; details?: Record<string, string[]> }

  if (!res.ok) {
    const errData = data as { error?: string; details?: Record<string, string[]> }
    // Surface Zod field errors when present so the UI shows which field failed
    if (errData.details && typeof errData.details === 'object') {
      const fieldMsgs = Object.entries(errData.details)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
        .join(' · ')
      throw new Error(fieldMsgs || errData.error || `HTTP ${res.status}`)
    }
    throw new Error(errData.error ?? `HTTP ${res.status}`)
  }

  return data
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
