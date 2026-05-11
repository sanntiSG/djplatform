import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useUpdateMediaItem } from '../../../hooks/useProfile.js'
import { useCatalogs } from '../../../hooks/useCatalogs.js'
import { DURATION, EASE, prefersReducedMotion } from '../../../utils/motion.js'
import type { MediaItem } from '../../../types/index.js'

interface MediaMetadataEditorProps {
  media: MediaItem
  isOwner: boolean
  profileQueryKey: string
}

export function MediaMetadataEditor({ media, isOwner, profileQueryKey }: MediaMetadataEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draftDesc, setDraftDesc] = useState(media.description ?? '')
  const [draftGenres, setDraftGenres] = useState<string[]>(media.genres ?? [])
  const containerRef = useRef<HTMLDivElement>(null)
  const { genres: catalogGenres } = useCatalogs()

  const { mutate: save, isPending } = useUpdateMediaItem(profileQueryKey)

  useEffect(() => {
    setDraftDesc(media.description ?? '')
    setDraftGenres(media.genres ?? [])
  }, [media.description, media.genres])

  useEffect(() => {
    if (editing && containerRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0.6, y: 6 },
        { opacity: 1, y: 0, duration: DURATION.micro, ease: EASE.out },
      )
    }
  }, [editing])

  const hasContent = !!(media.description || (media.genres?.length ?? 0) > 0)
  if (!hasContent && !isOwner) return null

  function toggleGenre(g: string) {
    if (draftGenres.includes(g)) {
      setDraftGenres(draftGenres.filter((x) => x !== g))
    } else {
      if (draftGenres.length >= 3) return
      setDraftGenres([...draftGenres, g])
    }
  }

  function handleSave() {
    if (!media.id) { setEditing(false); return }
    const descChanged = draftDesc.trim() !== (media.description ?? '')
    const genresChanged = JSON.stringify(draftGenres) !== JSON.stringify(media.genres ?? [])
    if (!descChanged && !genresChanged) { setEditing(false); return }
    save(
      { mediaId: media.id, patch: { description: draftDesc.trim(), genres: draftGenres } },
      {
        onSuccess: () => setEditing(false),
        onError: () => {
          setDraftDesc(media.description ?? '')
          setDraftGenres(media.genres ?? [])
        },
      },
    )
  }

  const activeGenres = catalogGenres.data ?? []

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-24 pt-16 lg:pb-8 lg:pr-24"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)' }}
    >
      {editing ? (
        <div ref={containerRef} className="flex flex-col gap-3">
          <textarea
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setEditing(false); setDraftDesc(media.description ?? ''); setDraftGenres(media.genres ?? []) }
            }}
            placeholder="Descripcion del track..."
            rows={2}
            maxLength={1000}
            className="w-full bg-black/40 rounded-xl px-4 py-3 font-sans text-sm text-white placeholder:text-white/40 resize-none focus:outline-none backdrop-blur-sm"
            style={{ border: '1px solid rgba(255,255,255,0.18)' }}
          />

          {activeGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeGenres.map((g) => {
                const selected = draftGenres.includes(g.name)
                const maxed = !selected && draftGenres.length >= 3
                return (
                  <button
                    key={g.name}
                    type="button"
                    disabled={maxed}
                    onClick={() => toggleGenre(g.name)}
                    className="px-3 py-1 rounded-full font-sans text-xs font-medium transition-all duration-150 disabled:opacity-30"
                    style={
                      selected
                        ? { background: 'var(--accent)', color: 'var(--bg)' }
                        : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    {g.name}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-white/40">{draftDesc.length}/1000</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditing(false); setDraftDesc(media.description ?? ''); setDraftGenres(media.genres ?? []) }}
                className="font-sans text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="font-sans text-xs font-medium disabled:opacity-50 transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              {media.title && (
                <p className="font-sans text-sm font-medium text-white/90 leading-snug drop-shadow-md">
                  {media.title}
                </p>
              )}
              {media.description ? (
                <p className="font-sans text-xs text-white/70 leading-relaxed line-clamp-2">
                  {media.description}
                </p>
              ) : isOwner ? (
                <p className="font-sans text-xs text-white/30 italic">Sin descripcion</p>
              ) : null}
              {(media.genres?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {media.genres!.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[10px] font-medium"
                      style={{ background: 'rgba(212,255,0,0.15)', color: 'var(--accent)' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Editar metadatos del track"
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 mb-0.5"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
