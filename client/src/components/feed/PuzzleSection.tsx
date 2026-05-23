import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion'
import { usePuzzleImages } from '../../hooks/usePuzzleImages'
import { usePointerKind } from '../../hooks/usePointerKind'
import { PuzzleBoard } from '../loading/PuzzleBoard'

gsap.registerPlugin(ScrollTrigger)

const DISMISS_KEY = 'puzzle-section-dismissed-v1'
const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4'
const TITLE_WORDS = ['Resoná.', 'Reordená.', 'Repetí.']

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}
function persist(): void {
  try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* noop */ }
}

// ── Close icon ───────────────────────────────────────────────
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── PuzzleSection ────────────────────────────────────────────

export function PuzzleSection() {
  const [isHidden, setIsHidden] = useState(isDismissed)
  const { currentImage, nextImage } = usePuzzleImages()
  const [image, setImage] = useState(currentImage)
  const pointerKind = usePointerKind()
  const mode = pointerKind === 'coarse' ? 'tap' : 'drag'
  const reduced = prefersReducedMotion()

  const sectionRef = useRef<HTMLElement>(null)
  const kickerRef = useRef<HTMLParagraphElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<HTMLSpanElement[]>([])

  const pieceSize = typeof window !== 'undefined'
    ? window.innerWidth < 640 ? 88 : window.innerWidth < 1024 ? 108 : 124
    : 108

  // ── GSAP scroll-triggered text animations
  useEffect(() => {
    if (isHidden) return
    const ctx = gsap.context(() => {
      if (kickerRef.current) {
        gsap.fromTo(
          kickerRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out,
            scrollTrigger: { trigger: kickerRef.current, start: 'top 88%', once: true } },
        )
      }

      const chars = charRefs.current.filter(Boolean)
      if (chars.length) {
        if (reduced) {
          gsap.set(chars, { opacity: 1, y: 0 })
        } else {
          gsap.fromTo(
            chars,
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
        gsap.fromTo(
          subRef.current,
          { opacity: 0, y: 14 },
          { opacity: 0.55, y: 0, duration: DURATION.slow, ease: EASE.out, delay: 0.38,
            scrollTrigger: { trigger: subRef.current, start: 'top 90%', once: true } },
        )
      }

      if (boardWrapRef.current) {
        gsap.fromTo(
          boardWrapRef.current,
          { opacity: 0, scale: 0.93 },
          { opacity: 1, scale: 1, duration: DURATION.slow, ease: EASE.out, delay: reduced ? 0 : 0.48,
            scrollTrigger: { trigger: boardWrapRef.current, start: 'top 90%', once: true } },
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [isHidden, reduced])

  // ── Close
  const handleClose = useCallback(() => {
    if (!sectionRef.current) { persist(); setIsHidden(true); return }
    gsap.to(sectionRef.current, {
      opacity: 0, y: -14, duration: 0.28, ease: 'power3.in',
      onComplete: () => { persist(); setIsHidden(true) },
    })
  }, [])

  // ── Puzzle solved → next image
  const handleSolved = useCallback(() => setImage(nextImage()), [nextImage])

  if (isHidden) return null

  // Reset char ref collection on each render
  charRefs.current = []

  return (
    <section
      ref={sectionRef}
      aria-label="Puzzle interactivo"
      style={{
        margin: '0 16px',
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 480,
      }}
      className="md:mx-6"
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
          filter: 'blur(3px) brightness(0.5) saturate(0.7)',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      {/* ── Overlay: vignette + bottom fade ──────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: [
            'radial-gradient(ellipse 80% 120% at 0% 50%, rgba(8,8,10,0.72) 0%, transparent 55%)',
            'linear-gradient(to bottom, rgba(8,8,10,0.6) 0%, rgba(8,8,10,0.1) 40%, rgba(8,8,10,0.75) 100%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />

      {/* ── Close button ─────────────────────────────── */}
      <button
        onClick={handleClose}
        aria-label="Cerrar juego"
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
          const b = e.currentTarget
          b.style.background = 'rgba(255,255,255,0.12)'
          b.style.color = '#f2f2f7'
          b.style.borderColor = 'rgba(255,255,255,0.25)'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget
          b.style.background = 'rgba(8,8,10,0.55)'
          b.style.color = 'rgba(242,242,247,0.65)'
          b.style.borderColor = 'rgba(255,255,255,0.12)'
        }}
      >
        <XIcon />
      </button>

      {/* ── Content ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          padding: 'clamp(36px, 6vw, 56px) clamp(24px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
        }}
        className="md:flex-row md:items-center md:justify-between md:gap-16"
      >
        {/* ── Text block ─────────────────────────── */}
        <div style={{ flex: 1 }}>

          {/* Kicker */}
          <p
            ref={kickerRef}
            style={{
              fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--accent, #d4ff00)',
              margin: '0 0 18px',
              display: 'flex', alignItems: 'center', gap: 8,
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
            Momento lúdico
          </p>

          {/* Title — split per character for stagger animation */}
          <h2
            style={{
              fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
              fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
              lineHeight: 0.93, letterSpacing: '-0.025em',
              color: 'var(--text, #f2f2f7)',
              margin: '0 0 24px',
              perspective: '600px',
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
              margin: '0 0 8px',
              maxWidth: '30ch', lineHeight: 1.55,
              opacity: 0,
            }}
          >
            Ordená la grilla mientras escuchás.
          </p>

          {/* Mode hint */}
          <p style={{
            fontFamily: 'Satoshi, sans-serif', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(242,242,247,0.22)', margin: 0,
          }}>
            {mode === 'tap' ? 'Tap dos piezas para intercambiar' : 'Arrastrá las piezas para ordenar'}
          </p>
        </div>

        {/* ── Puzzle board ───────────────────────── */}
        <div
          ref={boardWrapRef}
          style={{ flexShrink: 0, paddingRight: 56, opacity: 0 }}
        >
          <PuzzleBoard
            image={image}
            mode={mode}
            pieceSize={pieceSize}
            onSolved={handleSolved}
            showMiniPreview={false}
            showCounter
            animateEntrance
          />
        </div>
      </div>
    </section>
  )
}
