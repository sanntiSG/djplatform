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

  // Discovery text state — only shown when image.source === 'user'
  const [solvedDiscoveryName, setSolvedDiscoveryName] = useState<string | null>(null)
  const discoveryRef = useRef<HTMLDivElement>(null)
  const discoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Reset discovery text when image changes; animate in for user images
  useEffect(() => {
    if (discoveryTimerRef.current) {
      clearTimeout(discoveryTimerRef.current)
      discoveryTimerRef.current = null
    }
    setSolvedDiscoveryName(null)

    if (image.source !== 'user') return
    if (!discoveryRef.current) return

    if (reduced) {
      gsap.set(discoveryRef.current, { opacity: 1, y: 0 })
    } else {
      gsap.fromTo(
        discoveryRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.out, delay: 0.35 },
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.imageUrl])

  // Animate text transition when discovery name is revealed
  useEffect(() => {
    if (!solvedDiscoveryName || !discoveryRef.current || image.source !== 'user') return
    if (reduced) return
    gsap.fromTo(
      discoveryRef.current,
      { opacity: 0, scale: 0.96, y: 6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: EASE.pop },
    )
  }, [solvedDiscoveryName, image.source, reduced])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (discoveryTimerRef.current) clearTimeout(discoveryTimerRef.current)
    }
  }, [])

  // Coordinated exit when backend is ready
  useEffect(() => {
    if (!isReady || exitingRef.current) return
    exitingRef.current = true

    // Cancel any pending discovery timer before exiting
    if (discoveryTimerRef.current) {
      clearTimeout(discoveryTimerRef.current)
      discoveryTimerRef.current = null
    }

    if (reduced) {
      onDismiss?.()
      return
    }

    const run = async () => {
      if (boardRef.current) {
        await boardRef.current.forceSolve()
      }
      await new Promise<void>(r => setTimeout(r, 200))
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
    // For user images: reveal artist name, then advance after a delay
    if (image.source === 'user') {
      const artistName = image.name
      const el = discoveryRef.current

      if (el && !reduced) {
        // Phase out current text
        gsap.to(el, {
          opacity: 0, y: -5, duration: 0.18, ease: 'power2.in',
          onComplete: () => {
            setSolvedDiscoveryName(artistName)
          },
        })
      } else {
        setSolvedDiscoveryName(artistName)
      }

      // Advance to next image after showing the revealed name
      discoveryTimerRef.current = setTimeout(() => {
        discoveryTimerRef.current = null
        setSolvedDiscoveryName(null)
        setImage(nextImage())
      }, 1900)

      return
    }

    setImage(nextImage())
  }, [image, nextImage, reduced])

  const isUserImage = image.source === 'user'

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

      {/* Discovery text — only for real REsonar user images */}
      {isUserImage && (
        <div
          ref={discoveryRef}
          style={{
            textAlign: 'center',
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        >
          {solvedDiscoveryName ? (
            <p style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              fontWeight: 700,
              color: 'var(--accent, #d4ff00)',
              margin: 0,
              letterSpacing: '0.01em',
              lineHeight: 1.4,
            }}>
              Descubriste a {solvedDiscoveryName}
              {image.userId && (
                <a
                  href={`/p/${image.userId}`}
                  style={{
                    display: 'inline-block',
                    marginLeft: 8,
                    fontSize: '0.7em',
                    color: 'rgba(212,255,0,0.65)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(212,255,0,0.3)',
                  }}
                >
                  Ver perfil
                </a>
              )}
            </p>
          ) : (
            <p style={{
              fontFamily: 'Satoshi, sans-serif',
              fontSize: 'clamp(0.72rem, 1.8vw, 0.84rem)',
              fontWeight: 500,
              color: 'rgba(242,242,247,0.38)',
              margin: 0,
              letterSpacing: '0.02em',
              lineHeight: 1.4,
            }}>
              Descubrí a este artista de REsonar
            </p>
          )}
        </div>
      )}

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
