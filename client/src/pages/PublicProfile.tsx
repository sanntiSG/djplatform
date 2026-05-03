import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProfile } from '../hooks/useProfile.js'
import { useProfileEvents } from '../hooks/useEvents.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { MediaList } from '../components/media/MediaList.js'
import { EventCard } from '../components/events/EventCard.js'
import { WhatsAppButton } from '../components/ui/WhatsAppButton.js'
import { Pill } from '../components/ui/Pill.js'
import { Tabs } from '../components/ui/Tabs.js'
import { Button } from '../components/ui/Button.js'
import { THEMES } from '../components/profile/ThemeSelector.js'
import type { Availability, ProfileTheme } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

const availabilityVariant: Record<Availability, 'available' | 'contact' | 'unavailable'> = {
  available: 'available',
  contact: 'contact',
  unavailable: 'unavailable',
}

const availabilityLabel: Record<Availability, string> = {
  available: 'Disponible',
  contact: 'Consultar para coordinar',
  unavailable: 'No disponible',
}

const TABS = [
  { id: 'sets', label: 'Sets y Musica' },
  { id: 'events', label: 'Eventos' },
]

// Animated background canvas per theme
function ThemeBackground({ theme }: { theme: ProfileTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0

    const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0]
    const particleColor = themeConfig.particle

    function resize() {
      if (!canvas) return
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; da: number }

    const count = theme === 'void' ? 80 : theme === 'cosmic' ? 120 : 60
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1200,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.7 + 0.1,
      da: (Math.random() - 0.5) * 0.005,
    }))

    function hexToRgb(hex: string) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r},${g},${b}`
    }
    const rgb = hexToRgb(particleColor)

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.alpha += p.da
        if (p.alpha <= 0 || p.alpha >= 1) p.da *= -1
        if (p.y < 0) { p.y = h; p.x = Math.random() * w }
        if (p.x < 0 || p.x > w) p.x = Math.random() * w

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * window.devicePixelRatio, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb},${p.alpha})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ background: themeConfig.gradient }} />
      {theme === 'neon' && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.08) 2px, rgba(0,255,136,0.08) 4px)',
          }}
        />
      )}
      {theme === 'fire' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(249,115,22,0.4) 0%, transparent 70%)',
          }}
        />
      )}
      {theme === 'cosmic' && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(168,85,247,0.5) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 70% 60%, rgba(59,130,246,0.3) 0%, transparent 50%)',
          }}
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>()
  const { data: profile, isLoading } = useProfile(id!)
  const { data: events } = useProfileEvents(id!)
  const { user } = useAuthStore()
  const [tab, setTab] = useState('sets')
  const heroRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  const theme: ProfileTheme = (profile?.theme as ProfileTheme) ?? 'minimal'
  const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    if (!profile) return

    const ctx = gsap.context(() => {
      gsap.from('.profile-hero-item', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'expo.out',
        delay: 0.1,
      })

      gsap.from('.profile-info-section', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: infoRef.current,
          start: 'top 80%',
        },
      })
    })

    return () => ctx.revert()
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <p className="font-display text-[var(--text-muted)] text-xl">Perfil no encontrado</p>
        <Link to="/">
          <Button variant="outline" size="md">Volver al inicio</Button>
        </Link>
      </div>
    )
  }

  const isOwner = user?.profileId === profile.id
  const accentStyle = profile.accentColor ? { '--profile-accent': profile.accentColor } as React.CSSProperties : {}

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={accentStyle}>

      {/* ─── VISUAL HERO ──────────────────────────────────── */}
      <div
        ref={heroRef}
        className="relative w-full overflow-hidden"
        style={{ minHeight: 'min(70vw, 560px)' }}
      >
        {/* Animated theme background */}
        <ThemeBackground theme={theme} />

        {/* Cover image overlay */}
        {profile.coverImage && (
          <div className="absolute inset-0">
            <img
              src={profile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
              style={{ opacity: 0.35, filter: 'blur(1px) brightness(0.5)' }}
            />
          </div>
        )}

        {/* Gradient fade to bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 0%, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
        />

        {/* Profile content */}
        <div className="relative z-10 pt-28 pb-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-end">

            {/* Avatar with theme glow */}
            <div className="profile-hero-item flex-shrink-0">
              <div
                className="relative"
                style={{
                  filter: `drop-shadow(0 0 24px ${themeConfig.particle}44)`,
                }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.artistName}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-2"
                    style={{ borderColor: `${themeConfig.particle}40` }}
                  />
                ) : (
                  <div
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center border-2"
                    style={{
                      background: `${themeConfig.particle}15`,
                      borderColor: `${themeConfig.particle}40`,
                    }}
                  >
                    <span
                      className="font-display font-semibold text-5xl"
                      style={{ color: themeConfig.particle }}
                    >
                      {profile.artistName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 flex-1 pb-2">
              <div className="profile-hero-item flex flex-wrap items-center gap-3">
                <h1
                  className="font-display font-semibold text-[var(--text)] leading-none"
                  style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
                >
                  {profile.artistName}
                </h1>
                <Pill
                  label={availabilityLabel[profile.availability]}
                  variant={availabilityVariant[profile.availability]}
                />
              </div>

              {profile.location && (
                <p className="profile-hero-item font-sans text-sm text-[var(--text-muted)]">
                  {profile.location}
                </p>
              )}

              {profile.bio && (
                <p
                  className="profile-hero-item font-sans text-sm leading-relaxed max-w-xl"
                  style={{ color: 'rgba(242,242,247,0.85)' }}
                >
                  {profile.bio}
                </p>
              )}

              {profile.genres.length > 0 && (
                <div className="profile-hero-item flex flex-wrap gap-1.5">
                  {profile.genres.map((g) => (
                    <Pill key={g} label={g} variant="default" />
                  ))}
                </div>
              )}

              <div className="profile-hero-item flex flex-wrap gap-3 pt-1">
                {profile.whatsapp && (
                  <WhatsAppButton
                    number={profile.whatsapp}
                    message={`Hola ${profile.artistName}! Te escribo desde DJPlatform, me interesa contactarte.`}
                    size="md"
                  />
                )}
                {isOwner && (
                  <Link to="/profile/edit">
                    <Button variant="outline" size="md">Editar perfil</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTENT TABS ─────────────────────────────────── */}
      <div ref={infoRef} className="px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="profile-info-section">
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
          </div>

          {tab === 'sets' && (
            <div className="profile-info-section">
              {profile.media.length > 0 ? (
                <MediaList items={profile.media} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <p className="font-sans text-sm text-[var(--text-muted)]">
                    {isOwner
                      ? 'Agrega sets o videos desde la edicion de perfil.'
                      : 'Todavia no hay contenido publicado.'}
                  </p>
                  {isOwner && (
                    <Link to="/profile/edit">
                      <Button variant="outline" size="sm">Agregar musica</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="profile-info-section">
              {events && events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <p className="font-sans text-sm text-[var(--text-muted)]">
                    {isOwner ? 'No publicaste eventos todavia.' : 'Sin eventos publicados.'}
                  </p>
                  {isOwner && (
                    <Link to="/events/new">
                      <Button variant="outline" size="sm">Publicar evento</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
