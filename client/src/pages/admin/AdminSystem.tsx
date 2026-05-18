import { useState, useEffect } from 'react'
import { useSystemSettings, useUpdateSystemSettings } from '../../hooks/useAdmin.js'
import { Button } from '../../components/ui/Button.js'
import { Input } from '../../components/ui/Input.js'

export default function AdminSystem() {
  const { data: settings, isLoading } = useSystemSettings()
  const { mutate, isPending, isSuccess, isError } = useUpdateSystemSettings()

  const [minutes, setMinutes] = useState<number | ''>(1)
  const [hours, setHours] = useState<number | ''>(8)

  useEffect(() => {
    if (settings) {
      setMinutes(settings.trendingRefreshMinutes)
      setHours(settings.collabsFeedTtlHours ?? 8)
    }
  }, [settings])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!minutes || Number(minutes) < 1 || Number(minutes) > 1440) return
    if (!hours || Number(hours) < 1 || Number(hours) > 168) return
    mutate({
      trendingRefreshMinutes: Number(minutes),
      collabsFeedTtlHours: Number(hours),
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <h2 className="font-display font-semibold text-[var(--text)] text-xl mb-1">
          Configuracion del sistema
        </h2>
        <p className="font-sans text-sm text-[var(--text-muted)]">
          Controla como se actualiza el contenido externo (tendencias musicales y noticias).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Intervalo de actualizacion de noticias
          </label>
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                type="number"
                min={1}
                max={1440}
                value={minutes}
                onChange={e => setMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isLoading || isPending}
              />
            </div>
            <span className="font-sans text-sm text-[var(--text-muted)]">minutos</span>
          </div>
          <p className="font-sans text-xs text-[var(--text-muted)]">
            Cada cuanto tiempo se consultan Last.fm y los feeds RSS para actualizar tendencias y noticias.
            Minimo 1 minuto, maximo 1440 (24 horas). El cambio se aplica inmediatamente sin reiniciar el servidor.
          </p>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex flex-col gap-2">
          <label className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Vigencia de collabs en el feed
          </label>
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={e => setHours(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isLoading || isPending}
              />
            </div>
            <span className="font-sans text-sm text-[var(--text-muted)]">horas</span>
          </div>
          <p className="font-sans text-xs text-[var(--text-muted)]">
            Cuanto tiempo permanecen visibles las colaboraciones recientes en la seccion "Collabs" del feed principal.
            Default 8h, maximo 168h (1 semana). Las colaboraciones no se borran — solo dejan de aparecer en el feed.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={isLoading || !minutes || !hours}
          >
            Guardar
          </Button>
          {isSuccess && (
            <span className="font-sans text-xs text-green-400">
              Configuracion actualizada
            </span>
          )}
          {isError && (
            <span className="font-sans text-xs text-red-400">
              Error al guardar
            </span>
          )}
        </div>
      </form>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-3">
        <h3 className="font-sans text-sm font-medium text-[var(--text)]">
          Fuentes de noticias activas
        </h3>
        <ul className="font-sans text-xs text-[var(--text-muted)] flex flex-col gap-1.5">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            Indie Hoy — musica argentina (AR)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            La Nacion Musica — espectaculos (AR)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
            Rolling Stone MX — musica latinoamericana (LATAM)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] flex-shrink-0" />
            DJ Mag — electronica internacional (Mundial)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] flex-shrink-0" />
            Mixmag — electronica internacional (Mundial)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            Last.fm — tendencias musicales Argentina + Global
          </li>
        </ul>
        <p className="font-sans text-xs text-[var(--text-muted)] mt-1">
          Si un feed falla, los demas siguen funcionando. Las noticias se eliminan automaticamente despues de 12 horas.
        </p>
      </div>
    </div>
  )
}
