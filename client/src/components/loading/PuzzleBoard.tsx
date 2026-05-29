import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion'
import type { PoolImage } from '../../services/artistImageCache'

const STAGGER_PIECE = 0.04
const GAP = 4

export function shuffleIndices(): number[] {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.every((v, i) => v === i) ? shuffleIndices() : arr
}

function tileBgPos(tileIndex: number): string {
  const col = tileIndex % 3
  const row = Math.floor(tileIndex / 3)
  return `${col * 50}% ${row * 50}%`
}

interface PieceProps {
  tileIndex: number
  imageUrl: string
  size: number
  isSelected: boolean
  isCorrect: boolean
  mode: 'tap' | 'drag'
  pieceRef: (el: HTMLDivElement | null) => void
  onTap: () => void
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
}

function PuzzlePiece({ tileIndex, imageUrl, size, isSelected, isCorrect, mode, pieceRef, onTap, onPointerDown }: PieceProps) {
  return (
    <div
      ref={pieceRef}
      onPointerDown={mode === 'drag' ? onPointerDown : undefined}
      onClick={mode === 'tap' ? onTap : undefined}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: '300% 300%',
        backgroundPosition: tileBgPos(tileIndex),
        borderRadius: 6,
        border: isSelected
          ? '2px solid var(--accent)'
          : isCorrect
            ? '2px solid rgba(212,255,0,0.4)'
            : '2px solid rgba(255,255,255,0.06)',
        boxShadow: isSelected
          ? '0 0 0 4px rgba(212,255,0,0.25), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 2px 12px rgba(0,0,0,0.4)',
        cursor: mode === 'drag' ? 'grab' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        position: 'relative',
        transition: isSelected ? 'border 0.15s ease, box-shadow 0.15s ease' : 'border 0.3s ease',
        willChange: 'transform',
        overflow: 'hidden',
      }}
    >
      {isCorrect && !isSelected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,255,0,0.08)', pointerEvents: 'none' }} />
      )}
    </div>
  )
}

export interface PuzzleBoardHandle {
  forceSolve(): Promise<void>
}

export interface PuzzleBoardProps {
  image: PoolImage
  mode: 'tap' | 'drag'
  pieceSize: number
  onSolved?: (count: number) => void
  showMiniPreview?: boolean
  showCounter?: boolean
  animateEntrance?: boolean
}

export const PuzzleBoard = forwardRef<PuzzleBoardHandle, PuzzleBoardProps>(function PuzzleBoard({
  image,
  mode,
  pieceSize,
  onSolved,
  showMiniPreview = true,
  showCounter = true,
  animateEntrance = true,
}: PuzzleBoardProps, ref) {
  const [grid, setGrid] = useState<number[]>(shuffleIndices)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const solvedCountRef = useRef(0)
  const forcing = useRef(false)

  const pieceRefs = useRef<(HTMLDivElement | null)[]>(Array(9).fill(null))
  const gridRef = useRef<HTMLDivElement>(null)
  const gridCurrentRef = useRef(grid)
  const prevImageUrl = useRef(image.imageUrl)

  useEffect(() => { gridCurrentRef.current = grid }, [grid])

  const reduced = prefersReducedMotion()
  const gridSize = pieceSize * 3 + GAP * 2
  const correctCount = grid.filter((v, i) => v === i).length

  // Animate entrance + reset when image changes
  useEffect(() => {
    const isNew = image.imageUrl !== prevImageUrl.current
    prevImageUrl.current = image.imageUrl

    if (isNew) {
      setGrid(shuffleIndices())
      setSolved(false)
      setSelectedSlot(null)
    }

    if (!animateEntrance) return
    requestAnimationFrame(() => {
      const pieces = pieceRefs.current.filter(Boolean)
      if (!pieces.length) return
      if (reduced) { gsap.set(pieces, { opacity: 1, scale: 1, y: 0 }); return }
      gsap.fromTo(
        pieces,
        { opacity: 0, y: isNew ? 16 : 28, scale: isNew ? 0.85 : 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.enter, ease: isNew ? EASE.pop : EASE.out, stagger: STAGGER_PIECE },
      )
    })
  }, [image.imageUrl, animateEntrance, reduced])

  useImperativeHandle(ref, () => ({
    forceSolve: () => new Promise<void>((resolve) => {
      forcing.current = true
      const currentGrid = gridCurrentRef.current
      const misplaced = currentGrid.reduce<number[]>((acc, t, s) => { if (t !== s) acc.push(s); return acc }, [])

      if (misplaced.length === 0) {
        forcing.current = false
        resolve()
        return
      }

      // Record positions before any movement
      const rects = pieceRefs.current.map(el => el?.getBoundingClientRect())
      let completed = 0

      misplaced.forEach((slot, idx) => {
        const el = pieceRefs.current[slot]
        const tileIndex = currentGrid[slot]
        const fromRect = rects[slot]
        const toRect = rects[tileIndex]
        if (!el || !fromRect || !toRect) { completed++; return }

        gsap.to(el, {
          x: toRect.left - fromRect.left,
          y: toRect.top - fromRect.top,
          duration: 0.5,
          ease: 'power3.inOut',
          delay: idx * 0.04,
          onComplete: () => {
            completed++
            if (completed >= misplaced.length) {
              setGrid([0, 1, 2, 3, 4, 5, 6, 7, 8])
              requestAnimationFrame(() => {
                pieceRefs.current.forEach(el => { if (el) gsap.set(el, { clearProps: 'x,y' }) })
                forcing.current = false
                resolve()
              })
            }
          },
        })
      })
    }),
  }), [])

  const checkSolved = useCallback((newGrid: number[]) => {
    if (forcing.current) return
    if (!newGrid.every((v, i) => v === i)) return
    setSolved(true)
    solvedCountRef.current += 1
    const count = solvedCountRef.current

    // Celebration flash on grid
    if (!reduced && gridRef.current) {
      gsap.fromTo(
        gridRef.current,
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.4)', duration: 0.12, yoyo: true, repeat: 3, ease: 'power2.inOut',
          onComplete: () => setTimeout(() => onSolved?.(count), 300) },
      )
    } else {
      setTimeout(() => onSolved?.(count), 700)
    }
  }, [onSolved, reduced])

  // ── Tap-to-swap
  const handleTap = useCallback((slot: number) => {
    if (solved) return
    if (selectedSlot === null) {
      setSelectedSlot(slot)
      const el = pieceRefs.current[slot]
      if (el && !reduced) gsap.to(el, { scale: 1.07, duration: DURATION.micro, ease: 'elastic.out(1,0.5)' })
    } else if (selectedSlot === slot) {
      setSelectedSlot(null)
      const el = pieceRefs.current[slot]
      if (el && !reduced) gsap.to(el, { scale: 1, duration: DURATION.micro, ease: EASE.out })
    } else {
      const slotA = selectedSlot
      const slotB = slot
      const elA = pieceRefs.current[slotA]
      const elB = pieceRefs.current[slotB]

      if (elA && elB && !reduced) {
        const rA = elA.getBoundingClientRect()
        const rB = elB.getBoundingClientRect()
        const dx = rB.left - rA.left
        const dy = rB.top - rA.top
        gsap.fromTo(elA, { scale: 1.07 }, { x: dx, y: dy, scale: 1, duration: DURATION.slow, ease: 'power3.inOut', clearProps: 'x,y,scale' })
        gsap.fromTo(elB, { scale: 1 }, {
          x: -dx, y: -dy, scale: 1, duration: DURATION.slow, ease: 'power3.inOut', clearProps: 'x,y',
          onComplete: () => {
            gsap.fromTo(elA, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' })
            gsap.fromTo(elB, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' })
          },
        })
        setTimeout(() => {
          ;[slotA, slotB].forEach(s => {
            const el = pieceRefs.current[s]
            if (el) gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(212,255,0,0)' }, { boxShadow: '0 0 24px 4px rgba(212,255,0,0.3)', duration: 0.25, yoyo: true, repeat: 1 })
          })
        }, DURATION.slow * 1000 + 50)
      }

      setSelectedSlot(null)
      setGrid(prev => {
        const next = [...prev]
        ;[next[slotA], next[slotB]] = [next[slotB], next[slotA]]
        requestAnimationFrame(() => checkSolved(next))
        return next
      })
    }
  }, [selectedSlot, solved, checkSolved, reduced])

  // ── Drag (desktop)
  const dragState = useRef<{ slot: number; el: HTMLDivElement; clone: HTMLDivElement; startX: number; startY: number; rect: DOMRect } | null>(null)

  const handlePointerDown = useCallback((slot: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (solved || mode !== 'drag') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const el = pieceRefs.current[slot]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const clone = el.cloneNode(true) as HTMLDivElement
    Object.assign(clone.style, {
      position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`,
      zIndex: '9999', pointerEvents: 'none', margin: '0', opacity: '0.92',
      transform: 'scale(1.08) rotate(1.5deg)', transition: 'none',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(212,255,0,0.2)',
    })
    document.body.appendChild(clone)
    gsap.to(el, { opacity: 0.3, scale: 0.95, duration: DURATION.micro })
    dragState.current = { slot, el, clone, startX: e.clientX, startY: e.clientY, rect }
  }, [solved, mode])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return
    const { clone, rect, startX, startY } = dragState.current
    clone.style.left = `${rect.left + e.clientX - startX}px`
    clone.style.top = `${rect.top + e.clientY - startY}px`
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !gridRef.current) return
    const { slot: fromSlot, el, clone } = dragState.current
    dragState.current = null
    const gridRect = gridRef.current.getBoundingClientRect()
    const toCol = Math.max(0, Math.min(2, Math.floor((e.clientX - gridRect.left) / (gridRect.width / 3))))
    const toRow = Math.max(0, Math.min(2, Math.floor((e.clientY - gridRect.top) / (gridRect.height / 3))))
    const toSlot = toRow * 3 + toCol
    const targetEl = pieceRefs.current[toSlot]
    const targetRect = targetEl?.getBoundingClientRect()
    gsap.to(clone, {
      left: targetRect?.left ?? parseFloat(clone.style.left),
      top: targetRect?.top ?? parseFloat(clone.style.top),
      scale: 1, rotate: 0, duration: DURATION.base, ease: EASE.out,
      onComplete: () => {
        clone.remove()
        gsap.to(el, { opacity: 1, scale: 1, duration: DURATION.micro })
        if (toSlot !== fromSlot) {
          setGrid(prev => {
            const next = [...prev]
            ;[next[fromSlot], next[toSlot]] = [next[toSlot], next[fromSlot]]
            requestAnimationFrame(() => checkSolved(next))
            return next
          })
          if (!reduced && targetEl) gsap.fromTo(targetEl, { scale: 1.1 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1,0.5)' })
        }
      },
    })
  }, [checkSolved, reduced])

  return (
    <div style={{ position: 'relative', display: 'block' }}>
      {showMiniPreview && (
        <div style={{
          position: 'absolute', top: -4, left: -4, transform: 'translate(-100%, 0)',
          width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', opacity: 0.85,
        }}>
          <img src={image.imageUrl} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: 8, fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>
            objetivo
          </span>
        </div>
      )}

      {showCounter && (
        <div style={{
          position: 'absolute', top: -4, right: -4, transform: 'translate(100%, 0)',
          background: 'rgba(212,255,0,0.12)', border: '1px solid rgba(212,255,0,0.3)',
          borderRadius: 20, padding: '4px 10px', fontSize: 12,
          fontFamily: 'Satoshi, sans-serif', color: 'var(--accent, #d4ff00)',
          fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {correctCount}/9
        </div>
      )}

      <div
        ref={gridRef}
        onPointerMove={mode === 'drag' ? handlePointerMove : undefined}
        onPointerUp={mode === 'drag' ? handlePointerUp : undefined}
        onPointerLeave={mode === 'drag' ? handlePointerUp : undefined}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${pieceSize}px)`,
          gridTemplateRows: `repeat(3, ${pieceSize}px)`,
          gap: GAP,
          width: gridSize,
          height: gridSize,
        }}
      >
        {grid.map((tileIndex, slot) => (
          <PuzzlePiece
            key={slot}
            tileIndex={tileIndex}
            imageUrl={image.imageUrl}
            size={pieceSize}
            isSelected={selectedSlot === slot}
            isCorrect={tileIndex === slot}
            mode={mode}
            pieceRef={el => { pieceRefs.current[slot] = el }}
            onTap={() => handleTap(slot)}
            onPointerDown={e => handlePointerDown(slot, e)}
          />
        ))}
      </div>
    </div>
  )
})
