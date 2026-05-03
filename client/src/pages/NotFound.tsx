import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.js'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6 gap-6 text-center">
      <p
        className="font-display font-semibold"
        style={{ fontSize: 'clamp(6rem, 15vw, 12rem)', color: 'var(--surface-elevated)', lineHeight: 1 }}
      >
        404
      </p>
      <p className="font-display font-semibold text-[var(--text)]" style={{ fontSize: '1.5rem' }}>
        Pagina no encontrada
      </p>
      <p className="font-sans text-sm text-[var(--text-muted)] max-w-xs">
        El link que seguiste no existe o fue movido.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
