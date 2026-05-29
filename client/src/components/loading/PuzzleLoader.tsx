import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion'
import { usePuzzleImages } from '../../hooks/usePuzzleImages'
import { usePointerKind } from '../../hooks/usePointerKind'
import { PuzzleBoard, type PuzzleBoardHandle } from './PuzzleBoard'
import { ProgressWaveform } from './ProgressWaveform'

const ROTATE_TEXTS = [
  'Calibrando los monitores',
  'Subiendo el master a 0 dB',
  'Cargando crates de la noche',
  'Sincronizando los decks',
  'Ajustando el EQ del sistema',
  'Tu cabina está casi lista',
  'Afinando la pista de baile',
  'Cerrando el último loop',
  'Bajando las luces del club',
  'Soltando el primer drop',
]

function computePieceSize(): number {
  if (typeof window === 'undefined') return 116
  const w = window.innerWidth
  if (w < 380) return 80
  if (w < 640) return 96
  if (w < 1024) return 120
  return 144
}

interface PuzzleLoaderProps {
  onDismiss?: () => void
  isReady?: boolean
  progress?: number
}

export function PuzzleLoader({ onDismiss, isReady, progress = 0 }: PuzzleLoaderProps) {
  const { currentImage, nextImage } = usePuzzleImages()
  const [image, setImage] = useState(currentImage)
  const pointerKind = usePointerKind()
  const mode = pointerKind === 'coarse' ? 'tap' : 'drag'

  const [textIndex, setTextIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<PuzzleBoardHandle>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const exitingRef = useRef(false)
  const reduced = prefersReducedMotion()

  const [pieceSize, setPieceSize] = useState(() => computePieceSize())

  useEffect(() => {
    let rafId = 0
    const onResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setPieceSize(computePieceSize()))
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafId) }
  }, [])

  // Text rotation
  useEffect(() => {
    const id = setInterval(() => setTextIndex(i => (i + 1) % ROTATE_TEXTS.length), 4200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!textRef.current || reduced) return
    gsap.fromTo(textRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out })
  }, [textIndex, reduced])

  // Coordinated exit when backend is ready
  useEffect(() => {
    if (!isReady || exitingRef.current) return
    exitingRef.current = true

    if (reduced) {
      onDismiss?.()
      return
    }

    const run = async () => {
      // 1. Auto-resolve puzzle pieces
      if (boardRef.current) {
        await boardRef.current.forceSolve()
      }

      // 2. Brief hold showing complete image
      await new Promise<void>(r => setTimeout(r, 200))

      // 3. Morph: scale up + blur + fade out → hand off to feed
      const container = containerRef.current
      if (!container) { onDismiss?.(); return }
      gsap.timeline()
        .to(container, { scale: 1.04, duration: 0.5, ease: 'power2.in' }, 0)
        .to(container, { filter: 'blur(6px)', opacity: 0, duration: 0.45, ease: 'power2.inOut', onComplete: onDismiss }, 0.1)
    }

    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const handleSolved = useCallback(() => {
    setImage(nextImage())
  }, [nextImage])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--bg, #08080a)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(16px, 4vh, 32px)', padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <p style={{
        fontFamily: "'Clash Display', sans-serif", fontSize: 13, fontWeight: 600,
        letterSpacing: '0.18em', color: 'rgba(242,242,247,0.5)', textTransform: 'uppercase', margin: 0,
      }}>
        REsonar
      </p>

      <PuzzleBoard
        ref={boardRef}
        image={image}
        mode={mode}
        pieceSize={pieceSize}
        onSolved={handleSolved}
        showMiniPreview
        showCounter
        animateEntrance
      />

      <ProgressWaveform progress={progress} />

      <div style={{ textAlign: 'center', minHeight: 28 }}>
        <p ref={textRef} style={{
          fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
          fontWeight: 500, color: 'rgba(242,242,247,0.6)', margin: 0, letterSpacing: '0.01em',
        }}>
          {ROTATE_TEXTS[textIndex]}
        </p>
      </div>

      <p style={{
        fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(242,242,247,0.2)',
        margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {progress >= 85
          ? 'Casi listo'
          : mode === 'tap'
            ? 'Tap dos piezas para intercambiarlas'
            : 'Arrastrá las piezas para ordenarlas'}
      </p>
    </div>
  )
}
