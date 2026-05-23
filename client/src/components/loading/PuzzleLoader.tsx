import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion'
import { usePuzzleImages } from '../../hooks/usePuzzleImages'
import { usePointerKind } from '../../hooks/usePointerKind'
import type { PoolImage } from '../../services/artistImageCache'

// ─── helpers ────────────────────────────────────────────────

function shuffleIndices(): number[] {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  // Ensure it's not already solved
  return arr.every((v, i) => v === i) ? shuffleIndices() : arr
}

// background-position for a tile by its original index (0-8 in 3x3)
function tileBgPos(tileIndex: number): string {
  const col = tileIndex % 3
  const row = Math.floor(tileIndex / 3)
  return `${col * 50}% ${row * 50}%`
}

const ROTATE_TEXTS = [
  'Sintonizando frecuencias…',
  'Encendiendo la consola…',
  'Subiendo los faders…',
  'Tu sesión está casi lista',
  'Cerrando el loop…',
  'Sincronizando BPM…',
]

// ─── PuzzlePiece ────────────────────────────────────────────

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

function PuzzlePiece({
  tileIndex, imageUrl, size, isSelected, isCorrect, mode,
  pieceRef, onTap, onPointerDown,
}: PieceProps) {
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
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(212,255,0,0.08)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

// ─── PuzzleLoader ───────────────────────────────────────────

interface PuzzleLoaderProps {
  onDismiss?: () => void
  isReady?: boolean
}

export function PuzzleLoader({ onDismiss, isReady }: PuzzleLoaderProps) {
  const { currentImage, nextImage } = usePuzzleImages()
  const pointerKind = usePointerKind()
  const mode = pointerKind === 'coarse' ? 'tap' : 'drag'

  const [image, setImage] = useState<PoolImage>(currentImage)
  const [grid, setGrid] = useState<number[]>(shuffleIndices) // grid[slot] = tileIndex
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [solvedCount, setSolvedCount] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const [solved, setSolved] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const pieceRefs = useRef<(HTMLDivElement | null)[]>(Array(9).fill(null))
  const textRef = useRef<HTMLParagraphElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const reduced = prefersReducedMotion()

  // ── Piece size: responsive via window width
  const pieceSize = typeof window !== 'undefined'
    ? window.innerWidth < 640 ? 88 : window.innerWidth < 1024 ? 116 : 144
    : 116
  const gap = 4
  const gridSize = pieceSize * 3 + gap * 2

  // ── Entrance animation
  useEffect(() => {
    if (reduced) return
    const pieces = pieceRefs.current.filter(Boolean)
    gsap.fromTo(
      pieces,
      { opacity: 0, y: 28, scale: 0.9 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: DURATION.enter,
        ease: EASE.out,
        stagger: STAGGER_PIECE,
      },
    )
  }, [reduced])

  // ── Text rotation
  useEffect(() => {
    const id = setInterval(() => {
      setTextIndex(i => (i + 1) % ROTATE_TEXTS.length)
    }, 4200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!textRef.current || reduced) return
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out },
    )
  }, [textIndex, reduced])

  // ── Dismiss when isReady turns true
  useEffect(() => {
    if (!isReady || !containerRef.current) return
    if (reduced) { onDismiss?.(); return }
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.96,
      duration: DURATION.slow,
      ease: EASE.softOut,
      onComplete: onDismiss,
    })
  }, [isReady, onDismiss, reduced])

  // ── Check solved
  const checkSolved = useCallback((newGrid: number[]) => {
    if (newGrid.every((v, i) => v === i)) {
      setSolved(true)
      if (!reduced && gridRef.current) {
        gsap.to(gridRef.current, {
          '--glow': 1,
          duration: 0.15,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            // After celebration, load next image
            setTimeout(() => {
              const next = nextImage()
              setImage(next)
              setGrid(shuffleIndices())
              setSolved(false)
              setSelectedSlot(null)
              setSolvedCount(c => c + 1)
              // Stagger-in new pieces
              requestAnimationFrame(() => {
                const pieces = pieceRefs.current.filter(Boolean)
                if (reduced) return
                gsap.fromTo(
                  pieces,
                  { opacity: 0, scale: 0.85 },
                  { opacity: 1, scale: 1, duration: DURATION.enter, ease: EASE.pop, stagger: STAGGER_PIECE },
                )
              })
            }, 700)
          },
        })
      } else {
        setTimeout(() => {
          const next = nextImage()
          setImage(next)
          setGrid(shuffleIndices())
          setSolved(false)
          setSelectedSlot(null)
          setSolvedCount(c => c + 1)
        }, 700)
      }
    }
  }, [nextImage, reduced])

  // ── Tap-to-swap logic
  const handleTap = useCallback((slot: number) => {
    if (solved) return
    if (selectedSlot === null) {
      setSelectedSlot(slot)
      // Animate: lift selected piece
      const el = pieceRefs.current[slot]
      if (el && !reduced) {
        gsap.to(el, { scale: 1.07, duration: DURATION.micro, ease: 'elastic.out(1,0.5)' })
      }
    } else if (selectedSlot === slot) {
      // Deselect
      setSelectedSlot(null)
      const el = pieceRefs.current[slot]
      if (el && !reduced) gsap.to(el, { scale: 1, duration: DURATION.micro, ease: EASE.out })
    } else {
      // Swap selectedSlot ↔ slot
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
        gsap.fromTo(elB, { scale: 1 }, { x: -dx, y: -dy, scale: 1, duration: DURATION.slow, ease: 'power3.inOut',
          clearProps: 'x,y',
          onComplete: () => {
            // Elastic snap after arriving
            gsap.fromTo(elA, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' })
            gsap.fromTo(elB, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' })
          },
        })
      }

      setSelectedSlot(null)
      setGrid(prev => {
        const next = [...prev]
        ;[next[slotA], next[slotB]] = [next[slotB], next[slotA]]
        // Defer solved check after state update
        requestAnimationFrame(() => checkSolved(next))
        return next
      })

      // Glow hint if piece lands correctly
      setTimeout(() => {
        ;[slotA, slotB].forEach(s => {
          const el = pieceRefs.current[s]
          if (el && !reduced) {
            gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(212,255,0,0)' }, {
              boxShadow: '0 0 24px 4px rgba(212,255,0,0.3)', duration: 0.25,
              yoyo: true, repeat: 1,
            })
          }
        })
      }, DURATION.slow * 1000 + 50)
    }
  }, [selectedSlot, solved, checkSolved, reduced])

  // ── Drag logic (desktop)
  const dragState = useRef<{
    slot: number
    el: HTMLDivElement
    clone: HTMLDivElement
    startX: number
    startY: number
    rect: DOMRect
  } | null>(null)

  const handlePointerDown = useCallback((slot: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (solved || mode !== 'drag') return
    e.currentTarget.setPointerCapture(e.pointerId)

    const el = pieceRefs.current[slot]
    if (!el) return
    const rect = el.getBoundingClientRect()

    // Create floating clone
    const clone = el.cloneNode(true) as HTMLDivElement
    clone.style.position = 'fixed'
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.zIndex = '9999'
    clone.style.pointerEvents = 'none'
    clone.style.margin = '0'
    clone.style.opacity = '0.92'
    clone.style.transform = 'scale(1.08) rotate(1.5deg)'
    clone.style.transition = 'none'
    clone.style.boxShadow = '0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(212,255,0,0.2)'
    document.body.appendChild(clone)

    // Dim original
    gsap.to(el, { opacity: 0.3, scale: 0.95, duration: DURATION.micro })

    dragState.current = { slot, el, clone, startX: e.clientX, startY: e.clientY, rect }
  }, [solved, mode])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return
    const { clone, rect, startX, startY } = dragState.current
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    clone.style.left = `${rect.left + dx}px`
    clone.style.top = `${rect.top + dy}px`
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !gridRef.current) return
    const { slot: fromSlot, el, clone } = dragState.current
    dragState.current = null

    // Find closest slot
    const gridRect = gridRef.current.getBoundingClientRect()
    const colW = gridRect.width / 3
    const rowH = gridRect.height / 3
    const relX = e.clientX - gridRect.left
    const relY = e.clientY - gridRect.top
    const toCol = Math.max(0, Math.min(2, Math.floor(relX / colW)))
    const toRow = Math.max(0, Math.min(2, Math.floor(relY / rowH)))
    const toSlot = toRow * 3 + toCol

    // Animate clone to target slot center, then remove
    const targetEl = pieceRefs.current[toSlot]
    const targetRect = targetEl?.getBoundingClientRect()

    const snapX = targetRect ? targetRect.left : parseFloat(clone.style.left)
    const snapY = targetRect ? targetRect.top : parseFloat(clone.style.top)

    gsap.to(clone, {
      left: snapX, top: snapY,
      scale: 1, rotate: 0,
      duration: DURATION.base,
      ease: EASE.out,
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
          // Snap celebration
          if (!reduced && targetEl) {
            gsap.fromTo(targetEl, { scale: 1.1 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1,0.5)' })
          }
        } else {
          gsap.to(el, { opacity: 1, scale: 1, duration: DURATION.micro })
        }
      },
    })
  }, [checkSolved, reduced])

  const correctCount = grid.filter((v, i) => v === i).length

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg, #08080a)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: 'rgba(242,242,247,0.35)',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          REsonar
        </p>
      </div>

      {/* Grid wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Mini-preview */}
        <div style={{
          position: 'absolute',
          top: -4,
          left: -4,
          transform: 'translate(-100%, 0)',
          width: 56,
          height: 56,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          opacity: 0.85,
        }}>
          <img
            src={image.imageUrl}
            alt={image.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: '3px 5px',
          }}>
            <span style={{
              fontSize: 8,
              fontFamily: 'Satoshi, sans-serif',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1,
            }}>objetivo</span>
          </div>
        </div>

        {/* Piece count badge */}
        <div style={{
          position: 'absolute',
          top: -4,
          right: -4,
          transform: 'translate(100%, 0)',
          background: 'rgba(212,255,0,0.12)',
          border: '1px solid rgba(212,255,0,0.3)',
          borderRadius: 20,
          padding: '4px 10px',
          fontSize: 12,
          fontFamily: 'Satoshi, sans-serif',
          color: 'var(--accent, #d4ff00)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {correctCount}/9
        </div>

        {/* 3x3 grid */}
        <div
          ref={gridRef}
          onPointerMove={mode === 'drag' ? handlePointerMove : undefined}
          onPointerUp={mode === 'drag' ? handlePointerUp : undefined}
          onPointerLeave={mode === 'drag' ? handlePointerUp : undefined}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${pieceSize}px)`,
            gridTemplateRows: `repeat(3, ${pieceSize}px)`,
            gap,
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

      {/* Rotating text */}
      <div style={{ textAlign: 'center', minHeight: 28 }}>
        <p
          ref={textRef}
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
            fontWeight: 500,
            color: 'rgba(242,242,247,0.6)',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {ROTATE_TEXTS[textIndex]}
        </p>
        {solvedCount > 0 && (
          <p style={{
            fontFamily: 'Satoshi, sans-serif',
            fontSize: 12,
            color: 'rgba(212,255,0,0.5)',
            margin: '4px 0 0',
            letterSpacing: '0.05em',
          }}>
            {solvedCount} {solvedCount === 1 ? 'completado' : 'completados'}
          </p>
        )}
      </div>

      {/* Mode hint */}
      <p style={{
        fontFamily: 'Satoshi, sans-serif',
        fontSize: 11,
        color: 'rgba(242,242,247,0.2)',
        margin: 0,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {mode === 'tap' ? 'Tap dos piezas para intercambiarlas' : 'Arrastrá las piezas para ordenarlas'}
      </p>
    </div>
  )
}

const STAGGER_PIECE = 0.04
