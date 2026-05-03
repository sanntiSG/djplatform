import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { Button } from '../components/ui/Button.js'
import { Input } from '../components/ui/Input.js'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { user, setAuth } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasCurrentPassword = user?.mustChangePassword === false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirm) {
      setError('Las contrasenas no coinciden')
      return
    }

    setLoading(true)
    try {
      const response = await authService.changePassword({
        currentPassword: hasCurrentPassword ? currentPassword : undefined,
        newPassword,
      })
      setAuth(response.token, response.user)
      navigate('/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contrasena')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div>
          <h1 className="font-display font-semibold text-[var(--text)] text-2xl">
            Cambiar contrasena
          </h1>
          {user?.mustChangePassword && (
            <p className="font-sans text-sm text-yellow-400 mt-2">
              Por seguridad, configura una nueva contrasena antes de continuar.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {hasCurrentPassword && (
            <Input
              label="Contrasena actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}

          <Input
            label="Nueva contrasena"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />

          <Input
            label="Confirmar nueva contrasena"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm font-sans text-red-400">{error}</p>
          )}

          <Button type="submit" variant="primary" size="md" loading={loading}>
            Cambiar contrasena
          </Button>
        </form>
      </div>
    </div>
  )
}
