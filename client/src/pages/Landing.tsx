import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '../components/ui/Button.js'
import { useSpringPress } from '../hooks/useSpringPress.js'

gsap.registerPlugin(ScrollTrigger)

const GENRES = [
  'Techno', 'House', 'Minimal', 'Afro House', 'Deep House', 'Melodic Techno',
  'Trance', 'Drum & Bass', 'Ambient', 'Electronic', 'Progressive', 'Nu Disco',
  'Tech House', 'Organic House', 'Industrial', 'EBM', 'Remix', 'Cumbia', 'Enganche',
]

const FEATURES = [
  {
    id: 'a',
    title: 'Perfiles que comunican',
    body: 'Sets, eventos y disponibilidad — todo en un solo lugar para que tu sonido llegue mas lejos.',
    img: 'https://images.unsplash.com/photo-1571266028243-d220c6b94bf7?q=80&w=1200&auto=format&fit=crop',
    span: 'col-span-12 md:col-span-7 row-span-2',
    tall: true,
    accent: false,
  },
  {
    id: 'b',
    title: 'Busca por genero, zona y disponibilidad',
    body: 'Filtros reales. Encontra el artista exacto para tu evento, en tu ciudad.',
    img: 'https://images.unsplash.com/photo-1598387993441-a364f854cde3?q=80&w=900&auto=format&fit=crop',
    span: 'col-span-12 md:col-span-5 row-span-1',
    tall: false,
    accent: false,
  },
  {
    id: 'c',
    title: 'Contacto directo por WhatsApp. Sin intermediarios.',
    body: null,
    img: null,
    span: 'col-span-12 md:col-span-5 row-span-1',
    tall: false,
    accent: true,
  },
]

const MANIFESTO_WORDS = [
  'La', 'musica', 'conecta', 'personas.', 'Los', 'mejores', 'momentos',
  'de', 'tu', 'vida', 'tuvieron', 'un', 'soundtrack.', 'Este', 'es',
  'el', 'lugar', 'donde', 'ese', 'sonido', 'empieza.',
]

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const manifestoRef = useRef<HTMLDivElement>(null)
  const ctaImgRef = useRef<HTMLDivElement>(null)
  const bentoRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)

  const { ref: ctaRef, springHandlers: ctaHandlers } = useSpringPress<HTMLDivElement>(0.97)
  const { ref: cta2Ref, springHandlers: cta2Handlers } = useSpringPress<HTMLDivElement>(0.97)

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Accent dot pulse (infinite)
      if (dotRef.current) {
        gsap.to(dotRef.current, {
          scale: 1.5,
          opacity: 0.35,
          duration: 0.9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      }

      // Hero entrance
      gsap.from('.hero-headline', {
        y: 56,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.2,
      })
      gsap.from('.hero-kicker', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        delay: 0.1,
      })
      gsap.from('.hero-sub', {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        delay: 0.55,
      })
      gsap.from('.hero-cta', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.85,
      })

      // Bento cards staggered reveal
      gsap.from('.bento-card', {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.11,
        scrollTrigger: {
          trigger: bentoRef.current,
          start: 'top 75%',
        },
      })

      // Bento hover lift handled with CSS, also add GSAP scale on scroll reveal
      const bentoCards = bentoRef.current?.querySelectorAll('.bento-card')
      bentoCards?.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -4, duration: 0.32, ease: 'power2.out', overwrite: 'auto' })
        })
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.5)', overwrite: 'auto' })
        })
      })

      // Manifesto scrub — words fade in sequentially
      const words = manifestoRef.current?.querySelectorAll('.manifesto-word')
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.07, color: 'var(--text-muted)' },
          {
            opacity: 1,
            color: 'var(--text)',
            stagger: 0.06,
            ease: 'none',
            scrollTrigger: {
              trigger: manifestoRef.current,
              start: 'top 65%',
              end: 'bottom 30%',
              scrub: 1.8,
            },
          },
        )
      }

      // CTA image — scale + reveal on scroll
      if (ctaImgRef.current) {
        gsap.fromTo(
          ctaImgRef.current,
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: ctaImgRef.current,
              start: 'top 80%',
              end: 'bottom 20%',
              scrub: 0.9,
            },
          },
        )
      }

      // Para DJs / Para clientes cards
      gsap.from('.for-card', {
        y: 36,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.for-card',
          start: 'top 80%',
        },
      })

    })

    return () => ctx.revert()
  }, [])

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[var(--bg)]">

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 overflow-hidden md:pt-16"
      >
        {/* Ambient background — goes full bleed under notch on mobile */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-45"
            style={{
              background: 'radial-gradient(ellipse 90% 70% at 50% 38%, rgba(212,255,0,0.09) 0%, transparent 68%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background: 'radial-gradient(ellipse 50% 40% at 75% 20%, rgba(212,255,0,0.05) 0%, transparent 60%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-56"
            style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center gap-7">
          {/* Eyebrow kicker */}
          <div className="hero-kicker flex items-center gap-2.5">
            <span
              ref={dotRef}
              className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]"
            />
            <span className="font-sans font-bold text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
              Argentina — Electronica
            </span>
          </div>

          {/* H1 — max 2 lines, ultra-wide container */}
          <h1
            className="font-display font-semibold leading-[0.93] tracking-tighter"
            style={{ fontSize: 'clamp(3.2rem, 6.5vw, 7rem)' }}
          >
            <span className="hero-headline block text-[var(--text)]">El sound system</span>
            <span className="hero-headline block" style={{ color: 'var(--accent)' }}>
              de Argentina
            </span>
          </h1>

          <p
            className="hero-sub max-w-lg text-[var(--text-muted)] font-sans leading-relaxed"
            style={{ fontSize: 'clamp(0.95rem, 1.7vw, 1.1rem)' }}
          >
            La plataforma que conecta DJs, productores y artistas musicales con quienes buscan el
            sonido perfecto para su evento.
          </p>

          <div className="hero-cta flex flex-wrap items-center justify-center gap-3">
            <div ref={ctaRef} {...ctaHandlers}>
              <Link to="/profiles">
                <Button variant="primary" size="lg">
                  Explorar DJs
                </Button>
              </Link>
            </div>
            <div ref={cta2Ref} {...cta2Handlers}>
              <Link to="/auth/register">
                <Button variant="outline" size="lg">
                  Publicar mi perfil
                </Button>
              </Link>
            </div>
          </div>

          <Link
            to="/feed"
            className="hero-cta font-sans text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-1.5 mt-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Ir a la pagina principal
          </Link>
        </div>

        {/* Bottom hero image strip */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-14">
          <div
            className="w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)]"
            style={{ aspectRatio: '16/7' }}
          >
            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1170&auto=format&fit=crop"
              alt="DJ en escena"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.65) contrast(1.12) saturate(0.9)' }}
            />
            <div
              className="absolute inset-0 rounded-[var(--radius-lg)]"
              style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 45%)' }}
            />
          </div>
        </div>
      </section>

      {/* ─── MARQUEE PILLS ────────────────────────────────── */}
      <section className="py-10 border-y border-[var(--border)] overflow-hidden">
        <div
          ref={marqueeRef}
          className="flex gap-3 whitespace-nowrap animate-[marquee_36s_linear_infinite]"
        >
          {[...GENRES, ...GENRES].map((g, i) => (
            <span
              key={i}
              className="font-sans font-medium text-sm shrink-0 px-4 py-2 rounded-full border"
              style={{
                borderColor: i % 5 === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                color: i % 5 === 0 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* ─── BENTO GRID ───────────────────────────────────── */}
      <section className="py-32 md:py-48 px-6">
        <div className="max-w-7xl mx-auto">
          <h2
            className="font-display font-semibold text-[var(--text)] mb-14 max-w-xl leading-[0.95] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            Todo lo que necesitas para conectar
          </h2>

          <div
            ref={bentoRef}
            className="grid grid-cols-12 grid-rows-2 gap-4 grid-flow-dense auto-rows-fr"
          >
            {FEATURES.map((f) => (
              <div
                key={f.id}
                className={`bento-card ${f.span} group relative overflow-hidden rounded-[var(--radius-lg)] border cursor-default`}
                style={{
                  minHeight: f.tall ? '480px' : '220px',
                  backgroundColor: f.accent ? 'var(--accent)' : 'var(--surface)',
                  borderColor: f.accent ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {f.img && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{ filter: 'brightness(0.32) grayscale(0.35) contrast(1.12)' }}
                    />
                  </div>
                )}
                <div className="relative z-10 p-7 flex flex-col justify-end h-full">
                  <h3
                    className="font-display font-bold leading-tight mb-2"
                    style={{
                      fontSize: f.tall ? '1.65rem' : (f.accent ? '1.3rem' : '1.1rem'),
                      color: f.accent ? 'var(--bg)' : 'var(--text)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {f.title}
                  </h3>
                  {f.body && (
                    <p
                      className="font-sans text-sm leading-relaxed max-w-sm"
                      style={{ color: f.accent ? 'rgba(8,8,10,0.65)' : 'var(--text-muted)' }}
                    >
                      {f.body}
                    </p>
                  )}
                  {f.accent && (
                    <span
                      className="font-display font-bold mt-4 text-[var(--bg)] inline-flex items-center gap-2"
                      style={{ fontSize: '1rem' }}
                    >
                      WhatsApp directo
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MANIFESTO (SCRUB) ────────────────────────────── */}
      <section className="py-32 md:py-48 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div
            ref={manifestoRef}
            className="font-display font-semibold leading-[1.1] flex flex-wrap gap-x-[0.55em] gap-y-1"
            style={{ fontSize: 'clamp(1.85rem, 3.5vw, 3.1rem)' }}
          >
            {MANIFESTO_WORDS.map((w, i) => (
              <span
                key={i}
                className="manifesto-word inline-block"
                style={{
                  color: i === MANIFESTO_WORDS.length - 1 ? 'var(--accent)' : undefined,
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARA DJs / PARA CLIENTES ─────────────────────── */}
      <section className="py-32 md:py-48 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-4">
          {[
            {
              role: 'Para DJs y productores',
              desc: 'Crea tu perfil, sube tus sets, publica tus eventos y conecta con miles de personas que buscan tu sonido en toda Argentina.',
              cta: 'Crear perfil',
              href: '/auth/register',
              accent: true,
            },
            {
              role: 'Para quienes buscan',
              desc: 'Encontra el DJ perfecto para tu evento. Filtra por genero, ciudad y disponibilidad. Contactalo directo por WhatsApp.',
              cta: 'Explorar perfiles',
              href: '/profiles',
              accent: false,
            },
          ].map((item) => (
            <div
              key={item.role}
              className="for-card group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-10 flex flex-col justify-between gap-10 overflow-hidden transition-colors duration-300 hover:border-white/15"
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: item.accent
                    ? 'radial-gradient(circle, rgba(212,255,0,0.14) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                  transform: 'translate(30%, -30%)',
                }}
              />
              <div className="flex flex-col gap-5">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {item.role}
                </p>
                <p
                  className="font-display font-semibold text-[var(--text)] leading-[1.05] tracking-tight"
                  style={{ fontSize: 'clamp(1.35rem, 2.4vw, 1.9rem)' }}
                >
                  {item.desc}
                </p>
              </div>
              <Link to={item.href}>
                <Button variant={item.accent ? 'primary' : 'outline'} size="md">
                  {item.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section className="py-32 md:py-48 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div
            ref={ctaImgRef}
            className="relative w-full rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)]"
            style={{ minHeight: '440px' }}
          >
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1280&auto=format&fit=crop"
              alt="Evento en vivo"
              className="w-full h-full object-cover absolute inset-0"
              style={{ filter: 'brightness(0.28) contrast(1.18) saturate(0.85)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(212,255,0,0.07) 0%, transparent 70%)' }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-8 py-24 px-6">
              <h2
                className="font-display font-semibold text-[var(--text)] max-w-3xl leading-[0.93] tracking-tighter"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5.2rem)' }}
              >
                Tu sonido empieza aqui
              </h2>
              <p className="font-sans text-[var(--text-muted)] max-w-sm text-sm leading-relaxed">
                Unite a la plataforma de DJs y servicios musicales de Argentina. Gratis, rapido y visual.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/auth/register">
                  <Button variant="primary" size="lg">Empezar gratis</Button>
                </Link>
                <Link to="/profiles">
                  <Button variant="outline" size="lg">Ver DJs</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] px-6 py-12 pb-safe">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <span className="font-display font-semibold text-lg text-[var(--text)]">
            RE<span style={{ color: 'var(--accent)' }}>SONAR</span>
          </span>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Explorar', href: '/profiles' },
              { label: 'Feed', href: '/feed' },
              { label: 'Ingresar', href: '/auth/login' },
              { label: 'Registrarse', href: '/auth/register' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="font-sans text-xs text-[var(--text-muted)]">
            2026 REsonar. Solo Argentina.
          </span>
        </div>
      </footer>

    </main>
  )
}
