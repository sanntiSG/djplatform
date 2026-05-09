import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { MediaEmbed } from './MediaEmbed.js'
import { Button } from '../ui/Button.js'
import type { MediaItem } from '../../types/index.js'

interface MediaListProps {
  items: MediaItem[]
  editable?: boolean
  onRemove?: (index: number) => void
  onUpdate?: (index: number, newTitle: string) => void
  onItemClick?: (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => void
}

export function MediaList({ items, editable = false, onRemove, onUpdate, onItemClick }: MediaListProps) {
  const listRef = useRef<HTMLDivElement>(null)

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
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => onUpdate?.(i, e.target.value)}
              placeholder="Añadir título o descripción..."
              className="mt-2 w-full bg-transparent border-b border-[var(--border)] px-1 py-1 text-base sm:text-sm font-sans text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            item.title && (
              <p className="mt-1.5 text-xs text-[var(--text-muted)] font-sans">{item.title}</p>
            )
          )}
          {editable && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(i)}
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
