import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '../components/ui/Button.js'

gsap.registerPlugin(ScrollTrigger)

const GENRES = [
  'Techno', 'House', 'Minimal', 'Afro House', 'Deep House', 'Melodic Techno',
  'Trance', 'Drum & Bass', 'Ambient', 'Electronic', 'Progressive', 'Nu Disco',
  'Tech House', 'Organic House', 'Industrial', 'EBM',
]

const FEATURES = [
  {
    id: 'a',
    title: 'Perfiles que comunican',
    body: 'Cada DJ y productor tiene su espacio para mostrar su sonido, su historia y su disponibilidad. Medios embebidos, sets, eventos — todo en un solo lugar.',
    img: 'https://images.unsplash.com/photo-1571266028243-d220c6b94bf7?q=80&w=1200&auto=format&fit=crop',
    span: 'col-span-12 md:col-span-7 row-span-2',
    tall: true,
  },
  {
    id: 'b',
    title: 'Busca por genero, zona y disponibilidad',
    body: 'Filtros reales para encontrar el artista que necesitas para tu evento, en tu ciudad.',
    img: 'https://images.unsplash.com/photo-1598387993441-a364f854cde3?q=80&w=900&auto=format&fit=crop',
    span: 'col-span-12 md:col-span-5 row-span-1',
    tall: false,
  },
  {
    id: 'c',
    title: 'Contacto directo por WhatsApp',
    body: 'Sin intermediarios. Tocas el boton y hablas directamente con el artista.',
    img: 'https://images.unsplash.com/photo-1540039155733-5bb30b4f8a72?q=80&w=900&auto=format&fit=crop',
    span: 'col-span-12 md:col-span-5 row-span-1',
    tall: false,
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

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero entrance
      gsap.from('.hero-headline', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.15,
        delay: 0.2,
      })
      gsap.from('.hero-sub', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        delay: 0.6,
      })
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.1,
        delay: 0.9,
      })

      // Bento cards staggered reveal
      gsap.from('.bento-card', {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: bentoRef.current,
          start: 'top 75%',
        },
      })

      // Manifesto scrub — words fade in one by one as user scrolls
      const words = manifestoRef.current?.querySelectorAll('.manifesto-word')
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.08 },
          {
            opacity: 1,
            stagger: 0.06,
            ease: 'none',
            scrollTrigger: {
              trigger: manifestoRef.current,
              start: 'top 70%',
              end: 'bottom 30%',
              scrub: 1.5,
            },
          },
        )
      }

      // CTA image — scale from 0.88 as it enters, dims as it exits
      if (ctaImgRef.current) {
        gsap.fromTo(
          ctaImgRef.current,
          { scale: 0.88, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: ctaImgRef.current,
              start: 'top 80%',
              end: 'bottom 20%',
              scrub: 0.8,
            },
          },
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[var(--bg)]">

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden"
      >
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,255,0,0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-64 opacity-60"
            style={{
              background: 'linear-gradient(to top, var(--bg), transparent)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center gap-8">
          <h1
            className="font-display font-semibold leading-none tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 6.5vw, 7rem)' }}
          >
            <span className="hero-headline block text-[var(--text)]">El sound system</span>
            <span className="hero-headline block" style={{ color: 'var(--accent)' }}>
              de Argentina
            </span>
          </h1>

          <p
            className="hero-sub max-w-xl text-[var(--text-muted)] font-sans leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)' }}
          >
            La plataforma que conecta a DJs, productores y artistas musicales con quienes buscan el
            sonido perfecto para su evento.
          </p>

          <div className="hero-cta flex flex-wrap items-center justify-center gap-3">
            <Link to="/profiles">
              <Button variant="primary" size="lg">
                Explorar DJs
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button variant="outline" size="lg">
                Publicar mi perfil
              </Button>
            </Link>
          </div>

          <Link
            to="/feed"
            className="hero-cta font-sans text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-1.5 mt-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Ir a la pagina principal
          </Link>
        </div>

        {/* Bottom hero image strip */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-16">
          <div
            className="w-full rounded-xl overflow-hidden border border-[var(--border)]"
            style={{ aspectRatio: '16/7' }}
          >
            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="DJ en escena"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.7) contrast(1.1)' }}
            />
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  'linear-gradient(to top, var(--bg) 0%, transparent 40%)',
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ──────────────────────────────────────── */}
      <section className="py-10 border-y border-[var(--border)] overflow-hidden">
        <div ref={marqueeRef} className="flex gap-10 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
          {[...GENRES, ...GENRES].map((g, i) => (
            <span
              key={i}
              className="font-display font-semibold text-xl shrink-0"
              style={{ color: i % 4 === 0 ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* ─── BENTO GRID ───────────────────────────────────── */}
      <section className="py-32 md:py-48 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="font-sans text-[var(--text-muted)] text-sm uppercase tracking-widest mb-4">
            Plataforma
          </p>
          <h2
            className="font-display font-semibold text-[var(--text)] mb-16 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            Todo lo que necesitas para conectar
          </h2>

          <div
            ref={bentoRef}
            className="grid grid-cols-12 grid-rows-2 gap-4 auto-rows-fr"
            style={{ gridAutoFlow: 'dense' }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.id}
                className={`bento-card ${f.span} group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]`}
                style={{ minHeight: f.tall ? '480px' : '220px' }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={f.img}
                    alt={f.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ filter: 'brightness(0.35) grayscale(0.4) contrast(1.1)' }}
                  />
                </div>
                <div className="relative z-10 p-7 flex flex-col justify-end h-full">
                  <h3 className="font-display font-semibold text-[var(--text)] mb-2" style={{ fontSize: f.tall ? '1.6rem' : '1.15rem' }}>
                    {f.title}
                  </h3>
                  <p className="font-sans text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
                    {f.body}
                  </p>
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
            className="font-display font-semibold leading-snug flex flex-wrap gap-x-4 gap-y-1"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
          >
            {MANIFESTO_WORDS.map((w, i) => (
              <span
                key={i}
                className="manifesto-word inline-block"
                style={{
                  color: i === MANIFESTO_WORDS.length - 1 ? 'var(--accent)' : 'var(--text)',
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
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
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
              className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 flex flex-col justify-between gap-10 overflow-hidden transition-colors duration-300 hover:border-white/15"
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: item.accent
                    ? 'radial-gradient(circle, rgba(212,255,0,0.12) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                  transform: 'translate(30%, -30%)',
                }}
              />
              <div className="flex flex-col gap-4">
                <p className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  {item.role}
                </p>
                <p
                  className="font-display font-semibold text-[var(--text)] leading-snug"
                  style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
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
        <div className="max-w-7xl mx-auto relative">
          <div
            ref={ctaImgRef}
            className="relative w-full rounded-xl overflow-hidden border border-[var(--border)]"
            style={{ minHeight: '420px' }}
          >
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1280&auto=format&fit=crop"
              alt="Evento"
              className="w-full h-full object-cover absolute inset-0"
              style={{ filter: 'brightness(0.3) contrast(1.15)' }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-8 py-24 px-6">
              <h2
                className="font-display font-semibold text-[var(--text)] max-w-2xl"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
              >
                Tu sonido empieza aqui
              </h2>
              <p className="font-sans text-[var(--text-muted)] max-w-md text-base leading-relaxed">
                Unite a la plataforma de DJs y servicios musicales mas grande de Argentina.
                Gratis, rapido y visual.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/auth/register">
                  <Button variant="primary" size="lg">
                    Empezar gratis
                  </Button>
                </Link>
                <Link to="/profiles">
                  <Button variant="outline" size="lg">
                    Ver DJs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] px-6 py-14">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-display font-semibold text-lg text-[var(--text)]">
              RE<span style={{ color: 'var(--accent)' }}>SONAR</span>
            </span>
            <span className="font-sans text-sm text-[var(--text-muted)]">
              Plataforma de DJs y servicios musicales en Argentina.
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              { label: 'Explorar', href: '/profiles' },
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
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[var(--border)]">
          <p className="font-sans text-xs text-[var(--text-muted)]">
            2026 REsonar. Solo Argentina.
          </p>
        </div>
      </footer>

    </main>
  )
}
