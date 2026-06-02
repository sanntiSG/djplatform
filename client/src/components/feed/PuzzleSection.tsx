import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion'
import { usePuzzleImages } from '../../hooks/usePuzzleImages'
import { usePointerKind } from '../../hooks/usePointerKind'
import { PuzzleBoard } from '../loading/PuzzleBoard'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4'
const TITLE_WORDS = ['Resoná.', 'Reordená.', 'Reconocé.']
const LEGACY_DISMISS_KEY = 'puzzle-section-dismissed-v1'

function calcPieceSize(): number {
  if (typeof window === 'undefined') return 104
  const w = window.innerWidth
  if (w < 380) return 78
  if (w < 640) return 88
  if (w < 1024) return 104
  if (w < 1440) return 120
  return 132
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

type Mode = 'trailer' | 'playing'

export function PuzzleSection() {
  const [mode, setMode] = useState<Mode>('trailer')
  const [pieceSize, setPieceSize] = useState(calcPieceSize)
  const { currentImage, nextImage } = usePuzzleImages()
  const [image, setImage] = useState(currentImage)
  const pointerKind = usePointerKind()
  const inputMode = pointerKind === 'coarse' ? 'tap' : 'drag'
  const reduced = prefersReducedMotion()

  const sectionRef = useRef<HTMLElement>(null)
  const kickerRef = useRef<HTMLParagraphElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])
  const hasPlayedOnce = useRef(false)

  // Discovery text for real REsonar user images
  const [solvedDiscoveryName, setSolvedDiscoveryName] = useState<string | null>(null)
  const discoveryRef = useRef<HTMLDivElement>(null)
  const discoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPlaying = mode === 'playing'

  // Migrate users who previously dismissed the section permanently
  useEffect(() => {
    try { localStorage.removeItem(LEGACY_DISMISS_KEY) } catch { /* noop */ }
  }, [])

  // Reactive pieceSize on viewport resize (rAF-throttled)
  useEffect(() => {
    let raf: number
    const handler = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPieceSize(calcPieceSize()))
    }
    window.addEventListener('resize', handler, { passive: true })
    return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(raf) }
  }, [])

  // Mark that we've entered playing mode at least once
  useEffect(() => {
    if (mode === 'playing') hasPlayedOnce.current = true
  }, [mode])

  // ── Text animations: scroll-triggered on first load, instant on return from playing
  useEffect(() => {
    if (mode !== 'trailer') return

    const returning = hasPlayedOnce.current

    const ctx = gsap.context(() => {
      if (kickerRef.current) {
        if (returning) {
          gsap.fromTo(kickerRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          )
        } else {
          gsap.fromTo(kickerRef.current,
            { opacity: 0, y: 10 },
            {
              opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out,
              scrollTrigger: { trigger: kickerRef.current, start: 'top 88%', once: true }
            },
          )
        }
      }

      const chars = charRefs.current.filter(Boolean)
      if (chars.length) {
        if (reduced) {
          gsap.set(chars, { opacity: 1, y: 0 })
        } else if (returning) {
          gsap.fromTo(chars,
            { y: 20, opacity: 0, rotateX: -15, transformOrigin: '50% 100%' },
            { y: 0, opacity: 1, rotateX: 0, duration: 0.45, ease: 'back.out(1.4)', stagger: 0.02 },
          )
        } else {
          gsap.fromTo(chars,
            { y: 56, opacity: 0, rotateX: -42, transformOrigin: '50% 100%' },
            {
              y: 0, opacity: 1, rotateX: 0,
              duration: 0.72, ease: 'back.out(1.6)', stagger: 0.03,
              scrollTrigger: { trigger: chars[0], start: 'top 88%', once: true },
            },
          )
        }
      }

      if (subRef.current) {
        if (returning) {
          gsap.fromTo(subRef.current,
            { opacity: 0, y: 8 },
            { opacity: 0.55, y: 0, duration: 0.35, ease: 'power2.out', delay: 0.12 },
          )
        } else {
          gsap.fromTo(subRef.current,
            { opacity: 0, y: 14 },
            {
              opacity: 0.55, y: 0, duration: DURATION.slow, ease: EASE.out, delay: 0.38,
              scrollTrigger: { trigger: subRef.current, start: 'top 90%', once: true }
            },
          )
        }
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [mode, reduced])

  // ── CTA entrance when mode is trailer
  useEffect(() => {
    if (mode !== 'trailer' || !ctaRef.current) return
    if (reduced) { gsap.set(ctaRef.current, { opacity: 1 }); return }
    gsap.fromTo(ctaRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', delay: hasPlayedOnce.current ? 0.2 : 0.18 },
    )
  }, [mode, reduced])

  // ── Board entrance when mode is playing
  useEffect(() => {
    if (mode !== 'playing') return

    if (boardWrapRef.current) {
      if (reduced) {
        gsap.set(boardWrapRef.current, { opacity: 1, scale: 1, y: 0 })
      } else {
        gsap.fromTo(boardWrapRef.current,
          { opacity: 0, scale: 0.86, y: 18 },
          { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.55)' },
        )
      }
    }
  }, [mode, reduced])

  // ── Enter playing mode
  const handlePlay = useCallback(() => {
    if (reduced || !ctaRef.current) { setMode('playing'); return }
    gsap.to(ctaRef.current, {
      opacity: 0, scale: 0.94, y: -8, duration: 0.16, ease: 'power2.in',
      onComplete: () => setMode('playing'),
    })
  }, [reduced])

  // ── Return to trailer (X button and back button both call this)
  const handleBack = useCallback(() => {
    if (reduced || !boardWrapRef.current) { setMode('trailer'); return }
    gsap.to(boardWrapRef.current, {
      opacity: 0, scale: 0.95, duration: 0.28, ease: 'power2.in',
      onComplete: () => setMode('trailer'),
    })
  }, [reduced])

  // Reset discovery text when image changes; animate in for user images
  useEffect(() => {
    if (discoveryTimerRef.current) {
      clearTimeout(discoveryTimerRef.current)
      discoveryTimerRef.current = null
    }
    setSolvedDiscoveryName(null)

    if (image.source !== 'user' || !discoveryRef.current) return
    if (reduced) {
      gsap.set(discoveryRef.current, { opacity: 1, y: 0 })
    } else {
      gsap.fromTo(
        discoveryRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: DURATION.enter, ease: EASE.out, delay: 0.25 },
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.imageUrl])

  // Animate revealed artist name in
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
    return () => { if (discoveryTimerRef.current) clearTimeout(discoveryTimerRef.current) }
  }, [])

  // ── Puzzle solved: advance to next non-recent image
  const handleSolved = useCallback(() => {
    if (image.source === 'user') {
      const artistName = image.name
      const el = discoveryRef.current

      if (el && !reduced) {
        gsap.to(el, {
          opacity: 0, y: -5, duration: 0.18, ease: 'power2.in',
          onComplete: () => setSolvedDiscoveryName(artistName),
        })
      } else {
        setSolvedDiscoveryName(artistName)
      }

      discoveryTimerRef.current = setTimeout(() => {
        discoveryTimerRef.current = null
        setSolvedDiscoveryName(null)
        setImage(nextImage())
      }, 1900)
      return
    }

    setImage(nextImage())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, nextImage, reduced])

  // Reset char ref collection on each render
  charRefs.current = []

  return (
    <section
      ref={sectionRef}
      aria-label="Puzzle interactivo"
      className="mx-4 md:mx-6 rounded-[28px] overflow-hidden relative min-h-[420px] sm:min-h-[460px] md:min-h-[500px]"
    >
      {/* ── Video background ─────────────────────────── */}
      <video
        src={VIDEO_SRC}
        autoPlay={!reduced}
        loop={!reduced}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'blur(3px) brightness(0.5) saturate(0.85)',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      />

      {/* ── Overlay ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: [
            'radial-gradient(ellipse 80% 120% at 50% 50%, rgba(8,8,10,0.6) 0%, transparent 55%)',
            'linear-gradient(to bottom, rgba(8,8,10,0.65) 0%, rgba(8,8,10,0.08) 45%, rgba(8,8,10,0.78) 100%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />

      {/* ── Playing mode controls: X (top-right) ── */}
      {isPlaying && (
        <button
          onClick={handleBack}
          aria-label="Cerrar puzzle"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff00]"
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(8,8,10,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(242,242,247,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s, border-color 0.18s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.color = '#f2f2f7'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(8,8,10,0.55)'
            e.currentTarget.style.color = 'rgba(242,242,247,0.65)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        >
          <XIcon />
        </button>
      )}

      {/* ── Content ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          padding: isPlaying
            ? 'clamp(28px, 5vw, 48px) clamp(16px, 4vw, 40px)'
            : 'clamp(48px, 7vw, 72px) clamp(24px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isPlaying ? 20 : 32,
        }}
      >
        {/* ── Trailer text block (hidden when playing) ── */}
        {!isPlaying && (
          <div style={{ textAlign: 'center' }}>

            {/* Kicker */}
            <p
              ref={kickerRef}
              style={{
                fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
                fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'var(--accent, #d4ff00)',
                margin: '0 0 18px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent, #d4ff00)', display: 'inline-block',
                  flexShrink: 0,
                }}
                className="pulse-ring"
              />
              Revelá tu ritmo.
            </p>

            {/* Title — char-by-char for stagger animation */}
            <h2
              style={{
                fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
                fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
                lineHeight: 0.93, letterSpacing: '-0.025em',
                color: 'var(--text, #f2f2f7)',
                margin: '0 0 24px',
                perspective: '600px',
                textAlign: 'center',
              }}
            >
              {TITLE_WORDS.map((word, wi) => (
                <span key={wi} style={{ display: 'block' }}>
                  {word.split('').map((char, ci) => (
                    <span
                      key={ci}
                      ref={el => { if (el) charRefs.current.push(el) }}
                      style={{ display: 'inline-block', opacity: 0 }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </h2>

            {/* Subtitle */}
            <p
              ref={subRef}
              style={{
                fontFamily: 'Satoshi, sans-serif', fontWeight: 400,
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                color: 'rgba(242,242,247,0.55)',
                margin: '0 auto 28px',
                maxWidth: '30ch', lineHeight: 1.55,
                textAlign: 'center',
                opacity: 0,
              }}
            >
              Ordená la grilla mientras escuchás.
            </p>

            {/* CTA */}
            <button
              ref={ctaRef}
              onClick={handlePlay}
              aria-label="Empezar el puzzle"
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4ff00]"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 30px',
                borderRadius: 999,
                background: 'var(--accent, #d4ff00)',
                color: '#0a0a0a',
                border: 'none',
                fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
                fontSize: '0.95rem', letterSpacing: '0.01em',
                cursor: 'pointer',
                opacity: 0,
                boxShadow: '0 0 32px rgba(212,255,0,0.2), 0 4px 16px rgba(0,0,0,0.3)',
                transition: 'box-shadow 0.22s',
              }}
              onMouseEnter={e => {
                if (!reduced) gsap.to(e.currentTarget, { scale: 1.04, duration: 0.2, ease: 'power2.out' })
                e.currentTarget.style.boxShadow = '0 0 52px rgba(212,255,0,0.38), 0 4px 20px rgba(0,0,0,0.35)'
              }}
              onMouseLeave={e => {
                if (!reduced) gsap.to(e.currentTarget, { scale: 1, duration: 0.22, ease: 'power2.out' })
                e.currentTarget.style.boxShadow = '0 0 32px rgba(212,255,0,0.2), 0 4px 16px rgba(0,0,0,0.3)'
              }}
              onMouseDown={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 0.97, duration: 0.1 }) }}
              onMouseUp={e => { if (!reduced) gsap.to(e.currentTarget, { scale: 1.04, duration: 0.15 }) }}
            >
              Jugá ahora
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Playing mode: compact header + board ── */}
        {isPlaying && (
          <>
            {/* Short centered label */}
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
                  fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                  letterSpacing: '-0.02em',
                  color: 'var(--text, #f2f2f7)',
                  margin: '0 0 6px',
                  lineHeight: 1.15,
                }}
              >
                Ordená el rompecabezas
              </p>
              <p style={{
                fontFamily: 'Satoshi, sans-serif', fontSize: 'clamp(9px, 1.6vw, 11px)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(242,242,247,0.30)', margin: 0,
              }}>
                {inputMode === 'tap' ? 'Tocá dos piezas para intercambiar' : 'Arrastrá las piezas para ordenar'}
              </p>
            </div>

            {/* Board */}
            <div
              ref={boardWrapRef}
              style={{ flexShrink: 0, opacity: 0 }}
            >
              <PuzzleBoard
                image={image}
                mode={inputMode}
                pieceSize={pieceSize}
                onSolved={handleSolved}
                showMiniPreview={false}
                showCounter={false}
                animateEntrance
              />
            </div>

            {/* Discovery text — only for real REsonar user images */}
            {image.source === 'user' && (
              <div
                ref={discoveryRef}
                style={{
                  textAlign: 'center',
                  opacity: 0,
                  willChange: 'transform, opacity',
                  minHeight: 24,
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
          </>
        )}
      </div>
    </section>
  )
}
