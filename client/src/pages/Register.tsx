import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Button } from '../components/ui/Button.js'
import { Input } from '../components/ui/Input.js'
import { authService } from '../services/authService.js'
import { useAuthStore } from '../store/useAuthStore.js'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authService.register({ email, password })
      setAuth(token, user)
      navigate('/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle(credential: string) {
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authService.googleAuth(credential)
      setAuth(token, user)
      navigate('/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error con Google')
    } finally {
      setLoading(false)
    }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Link to="/" className="font-display font-semibold text-lg text-[var(--text)]">
            DJ<span style={{ color: 'var(--accent)' }}>Platform</span>
          </Link>
          <h1 className="font-display font-semibold text-[var(--text)] mt-6" style={{ fontSize: '1.75rem' }}>
            Crea tu cuenta
          </h1>
          <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
            Es gratis. Sin tarjeta de credito.
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
          <Input
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            autoComplete="new-password"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-2">
            Crear cuenta
          </Button>
        </form>

        {googleClientId && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs font-sans text-[var(--text-muted)]">o</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(res) => {
                  if (res.credential) handleGoogle(res.credential)
                }}
                onError={() => setError('Error al registrar con Google')}
                theme="filled_black"
                shape="pill"
                size="large"
              />
            </div>
          </>
        )}

        <p className="mt-8 text-center text-sm font-sans text-[var(--text-muted)]">
          Ya tenes cuenta?{' '}
          <Link to="/auth/login" className="text-[var(--accent)] hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
