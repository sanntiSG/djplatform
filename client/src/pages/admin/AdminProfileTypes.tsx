import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import {
  useAdminProfileTypes,
  useCreateProfileType,
  useUpdateProfileType,
  useDeleteProfileType,
} from '../../hooks/useProfileTypes.js'
import { Button } from '../../components/ui/Button.js'
import { Input } from '../../components/ui/Input.js'
import { cn } from '../../utils/cn.js'
import { prefersReducedMotion } from '../../utils/motion.js'
import type { AdminProfileTypeItem } from '../../services/catalogService.js'

export default function AdminProfileTypes() {
  const { data: types, isLoading } = useAdminProfileTypes()
  const { mutateAsync: createType, isPending: creating } = useCreateProfileType()
  const { mutateAsync: updateType } = useUpdateProfileType()
  const { mutateAsync: deleteType } = useDeleteProfileType()

  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const addedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!listRef.current || !types?.length || prefersReducedMotion()) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.type-row')
    gsap.from(rows, { y: 16, opacity: 0, duration: 0.4, ease: 'expo.out', stagger: 0.04, delay: 0.05 })
  }, [isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!addedIdRef.current || !listRef.current || prefersReducedMotion()) return
    const row = listRef.current.querySelector<HTMLElement>(`[data-id="${addedIdRef.current}"]`)
    if (row) gsap.fromTo(row, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' })
    addedIdRef.current = null
  }, [types])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    try {
      const created = await createType(newName.trim())
      addedIdRef.current = created.id
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  async function handleToggle(t: AdminProfileTypeItem) {
    try {
      await updateType({ id: t.id, patch: { isActive: !t.isActive } })
    } catch {
      // silent — query re-syncs
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteType(id)
      setConfirmDeleteId(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al borrar')
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display font-semibold text-[var(--text)] text-xl">Tipos de perfil</h2>
        <p className="font-sans text-sm text-[var(--text-muted)] mt-1">
          Los tipos base (DJ, Productor, Artista) no pueden eliminarse. Podes agregar tipos adicionales.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3 items-end max-w-sm">
        <Input
          label="Agregar tipo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: Musico, Banda, Locutora..."
        />
        <Button type="submit" variant="primary" size="md" loading={creating}>
          Crear
        </Button>
      </form>
      {error && <p className="font-sans text-sm text-red-400 -mt-4">{error}</p>}
      {deleteError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 font-sans text-sm text-red-400">
          {deleteError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !types?.length ? (
        <p className="font-sans text-sm text-[var(--text-muted)]">No hay tipos todavia.</p>
      ) : (
        <div ref={listRef} className="flex flex-col gap-2">
          {types.map((t) => (
            <div
              key={t.id}
              data-id={t.id}
              className="type-row flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]"
            >
              <div className="flex-1 min-w-0">
                <span className="font-sans text-sm font-medium text-[var(--text)]">{t.name}</span>
                <span className="font-sans text-xs text-[var(--text-muted)] ml-2">{t.slug}</span>
                {t.isProtected && (
                  <span className="font-sans text-xs text-[var(--text-muted)] ml-2 opacity-60">(base)</span>
                )}
              </div>

              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-xs font-medium',
                  t.isActive
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'bg-white/5 text-[var(--text-muted)]',
                )}
              >
                {t.isActive ? 'Activo' : 'Inactivo'}
              </span>

              <button
                type="button"
                onClick={() => handleToggle(t)}
                className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-2 py-1"
              >
                {t.isActive ? 'Desactivar' : 'Activar'}
              </button>

              {t.isProtected ? (
                <span className="font-sans text-xs text-[var(--text-muted)] opacity-40 px-2 py-1 select-none">
                  Protegido
                </span>
              ) : confirmDeleteId === t.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs text-[var(--text-muted)]">Confirmar?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="font-sans text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Si, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(t.id)}
                  className="font-sans text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors px-2 py-1"
                >
                  Borrar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
