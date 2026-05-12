import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useCatalogs } from '../../hooks/useCatalogs.js'
import { MediaEmbed } from './MediaEmbed.js'
import { MultiSelect } from '../ui/Select.js'
import { Button } from '../ui/Button.js'
import type { MediaItem } from '../../types/index.js'

interface MediaListProps {
  items: MediaItem[]
  editable?: boolean
  onRemove?: (index: number) => void
  onUpdate?: (index: number, patch: Partial<Pick<MediaItem, 'title' | 'description' | 'genres'>>) => void
  onItemClick?: (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => void
}

export function MediaList({ items, editable = false, onRemove, onUpdate, onItemClick }: MediaListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const { genres } = useCatalogs()

  const genreOptions = (genres.data ?? []).map((g) => ({ value: g.name, label: g.name }))

  useEffect(() => {
    if (!listRef.current || items.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.media-item', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'expo.out',
      })
    }, listRef)
    return () => ctx.revert()
  }, [items.length])

  if (items.length === 0) return null

  return (
    <div ref={listRef} className="grid grid-cols-1 lg:grid-cols-2 gap-5 justify-center">
      {items.map((item, i) => (
        <div
          key={i}
          data-item-id={item.id}
          className="media-item relative group"
          onClick={(e) => {
            if (!editable && onItemClick && item.id) {
              const rect = e.currentTarget.getBoundingClientRect()
              onItemClick({ kind: 'media', id: item.id }, rect)
            }
          }}
        >
          <MediaEmbed item={item} />

          {editable ? (
            <div className="flex flex-col gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => onUpdate?.(i, { title: e.target.value })}
                placeholder="Titulo..."
                className="w-full bg-transparent border-b border-[var(--border)] px-1 py-1 text-base sm:text-sm font-sans text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => onUpdate?.(i, { description: e.target.value })}
                placeholder="Descripcion (opcional)..."
                maxLength={1000}
                rows={2}
                className="w-full bg-transparent border border-[var(--border)] rounded-md px-2 py-1.5 text-xs font-sans text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none transition-colors"
              />
              <MultiSelect
                options={genreOptions}
                value={item.genres ?? []}
                onChange={(v) => onUpdate?.(i, { genres: v })}
                placeholder="Generos (max 3)..."
                max={3}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-1.5">
              {item.title && (
                <p className="text-xs text-[var(--text-muted)] font-sans">{item.title}</p>
              )}
              {item.description && (
                <p className="text-xs text-[var(--text-muted)]/70 font-sans line-clamp-2">{item.description}</p>
              )}
              {(item.genres?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.genres!.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center px-2 py-0.5 rounded-full font-sans text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {editable && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove(i) }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 text-red-400 hover:text-red-300 transition-opacity"
            >
              Eliminar
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
