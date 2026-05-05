import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProfile } from '../hooks/useProfile.js'
import { useProfileEvents } from '../hooks/useEvents.js'
import { useAuthStore } from '../store/useAuthStore.js'
import {
  useProfileSocial,
  useFollow,
  useProfileLike,
} from '../hooks/useProfileSocial.js'
import { MediaList } from '../components/media/MediaList.js'
import { EventCard } from '../components/events/EventCard.js'
import { WhatsAppButton } from '../components/ui/WhatsAppButton.js'
import { Pill } from '../components/ui/Pill.js'
import { Tabs } from '../components/ui/Tabs.js'
import { Button } from '../components/ui/Button.js'
import { ProfilePhotoGrid } from '../components/profile/ProfilePhotoGrid.js'
import { ProfileComments } from '../components/profile/ProfileComments.js'
import { THEMES } from '../components/profile/ThemeSelector.js'
import type { Availability, ProfileTheme } from '../types/index.js'

gsap.registerPlugin(ScrollTrigger)

const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: 'Disponible',
  contact: 'Consultar',
  unavailable: 'No disponible',
}

const AVAILABILITY_VARIANT: Record<Availability, 'available' | 'contact' | 'unavailable'> = {
  available: 'available',
  contact: 'contact',
  unavailable: 'unavailable',
}

const TYPE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  other: 'Artista',
}

const PROFILE_TABS = [
  { id: 'sets', label: 'Sets y Musica' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'events', label: 'Eventos' },
  { id: 'comments', label: 'Comentarios' },
]

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
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.08) 2px, rgba(0,255,136,0.08) 4px)',
          }}
        />
      )}
      {theme === 'fire' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2/3 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(249,115,22,0.4) 0%, transparent 70%)',
          }}
        />
      )}
      {theme === 'cosmic' && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(168,85,247,0.5) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 70% 60%, rgba(59,130,246,0.3) 0%, transparent 50%)',
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
  const { user, token } = useAuthStore()
  const [tab, setTab] = useState('sets')
  const [shareNotice, setShareNotice] = useState(false)
  const scopeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Social hooks - use profile's MongoDB ID extracted from slug-id
  const profileMongoId = id ? id.match(/[0-9a-fA-F]{24}$/)?.[0] ?? '' : ''
  const { data: social } = useProfileSocial(profileMongoId)
  const { mutate: toggleFollow, isPending: followPending } = useFollow(profileMongoId)
  const { mutate: toggleLike, isPending: likePending } = useProfileLike(profileMongoId)

  const theme: ProfileTheme = (profile?.theme as ProfileTheme) ?? 'minimal'
  const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  const profileAccent = profile?.accentColor || themeConfig.particle

  // Inject OG meta tags for link sharing
  useEffect(() => {
    if (!profile) return

    const title = `${profile.artistName} | DJPlatform`
    const description = profile.bio
      ? profile.bio.slice(0, 160)
      : `Perfil de ${profile.artistName} en DJPlatform Argentina`
    const image = profile.coverImage || profile.avatar || ''

    document.title = title

    const setMeta = (attr: 'property' | 'name', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('property', 'og:type', 'profile')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:url', window.location.href)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    return () => {
      document.title = 'DJPlatform'
    }
  }, [profile])

  // GSAP entrance animations
  useEffect(() => {
    if (!profile || !scopeRef.current) return

    const ctx = gsap.context(() => {
      gsap.from('.pi', {
        y: 20,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'expo.out',
        delay: 0.1,
      })

      if (contentRef.current) {
        gsap.from('.pct', {
          y: 22,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 83%',
          },
        })
      }
    }, scopeRef)

    return () => ctx.revert()
  }, [profile])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.artistName ?? 'DJPlatform',
          text: profile?.bio ?? '',
          url,
        })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareNotice(true)
      setTimeout(() => setShareNotice(false), 2000)
    }
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
  const accentStyle = profile.accentColor
    ? ({ '--profile-accent': profile.accentColor } as React.CSSProperties)
    : {}

  const followerCount = social?.followerCount ?? 0
  const likeCount = social?.likeCount ?? 0
  const commentCount = social?.commentCount ?? 0

  const stats = [
    { value: followerCount, label: followerCount === 1 ? 'Seguidor' : 'Seguidores' },
    { value: profile.media.length, label: profile.media.length === 1 ? 'Set' : 'Sets' },
    { value: events?.length ?? 0, label: (events?.length ?? 0) === 1 ? 'Evento' : 'Eventos' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={accentStyle}>

      {/* ─── HERO ─── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(290px, 50vw, 480px)' }}
      >
        <ThemeBackground theme={theme} />

        {profile.coverImage && (
          <div className="absolute inset-0">
            <img
              src={profile.coverImage}
              alt="Portada"
              className="w-full h-full object-cover"
              style={{ opacity: 0.4, filter: 'brightness(0.55)' }}
            />
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '58%',
            background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 110% 70% at 50% 0%, transparent 38%, rgba(0,0,0,0.52) 100%)',
          }}
        />

        {isOwner && (
          <div className="absolute z-10" style={{ top: 76, right: 20 }}>
            <Link to="/profile/edit">
              <button
                className="font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg transition-colors duration-150"
                style={{
                  background: 'rgba(0,0,0,0.38)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                Editar perfil
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ─── PROFILE CONTENT ─── */}
      <div ref={scopeRef} className="pb-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">

          {/* Avatar — centered, overlaps hero */}
          <div className="pi flex flex-col items-center" style={{ marginTop: '-52px', marginBottom: '12px' }}>
            <div style={{ filter: `drop-shadow(0 0 28px ${profileAccent}2a)` }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.artistName}
                  className="rounded-full object-cover"
                  style={{
                    width: 104,
                    height: 104,
                    border: '4px solid var(--bg)',
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 104,
                    height: 104,
                    background: `${profileAccent}1c`,
                    border: '4px solid var(--bg)',
                  }}
                >
                  <span
                    className="font-display font-bold"
                    style={{ fontSize: 38, color: profileAccent }}
                  >
                    {profile.artistName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name + type + availability — centered */}
          <div className="flex flex-col items-center gap-1 text-center">
            <h1
              className="pi font-display font-semibold text-[var(--text)] leading-none"
              style={{ fontSize: 'clamp(1.85rem, 5vw, 2.85rem)' }}
            >
              {profile.artistName}
            </h1>
            <div className="pi flex items-center gap-2 flex-wrap justify-center">
              <span className="font-sans text-sm text-[var(--text-muted)]">
                {TYPE_LABEL[profile.type] ?? profile.type}
              </span>
              {profile.location && (
                <>
                  <span className="text-[var(--text-muted)] opacity-40 select-none">·</span>
                  <span className="font-sans text-sm text-[var(--text-muted)]">{profile.location}</span>
                </>
              )}
            </div>
            <div className="pi mt-1">
              <Pill
                label={AVAILABILITY_LABEL[profile.availability]}
                variant={AVAILABILITY_VARIANT[profile.availability]}
              />
            </div>
          </div>

          {/* Stats row — centered */}
          <div className="pi flex items-center justify-center gap-8 mt-5">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display font-semibold text-[var(--text)] leading-none" style={{ fontSize: 22 }}>
                    {stat.value}
                  </span>
                  <span
                    className="font-sans uppercase tracking-widest text-[var(--text-muted)]"
                    style={{ fontSize: 10 }}
                  >
                    {stat.label}
                  </span>
                </div>
                {i < stats.length - 1 && (
                  <div className="h-7 bg-[var(--border)]" style={{ width: 1 }} />
                )}
              </div>
            ))}
          </div>

          {/* Bio — centered for short bios, left for long */}
          {profile.bio && (
            <p
              className="pi font-sans text-sm leading-relaxed mt-4 text-center mx-auto"
              style={{ color: 'rgba(242,242,247,0.72)', maxWidth: '48ch' }}
            >
              {profile.bio}
            </p>
          )}

          {/* Genre pills — centered */}
          {profile.genres.length > 0 && (
            <div className="pi flex flex-wrap gap-1.5 mt-4 justify-center">
              {profile.genres.map((g) => (
                <Pill key={g} label={g} variant="default" />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="pi flex flex-wrap items-center justify-center gap-3 mt-6">
            {/* Follow button */}
            {token && !isOwner && (
              <button
                type="button"
                disabled={followPending}
                onClick={() => toggleFollow()}
                className="font-sans text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-150 disabled:opacity-50"
                style={
                  social?.isFollowing
                    ? {
                        background: 'transparent',
                        border: '1.5px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-muted)',
                      }
                    : {
                        background: 'var(--accent)',
                        border: '1.5px solid var(--accent)',
                        color: 'var(--bg)',
                      }
                }
              >
                {social?.isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}

            {/* Like button */}
            {token && !isOwner && (
              <button
                type="button"
                disabled={likePending}
                onClick={() => toggleLike()}
                className="flex items-center gap-1.5 font-sans text-sm px-4 py-2.5 rounded-full border border-[var(--border)] transition-all duration-150 disabled:opacity-50"
                style={{
                  color: social?.isLiked ? profileAccent : 'var(--text-muted)',
                  borderColor: social?.isLiked ? `${profileAccent}40` : undefined,
                  background: social?.isLiked ? `${profileAccent}0d` : undefined,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={social?.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
            )}

            {/* WhatsApp */}
            {profile.whatsapp && (
              <WhatsAppButton
                number={profile.whatsapp}
                message={`Hola ${profile.artistName}! Te escribo desde DJPlatform, me interesa contactarte.`}
                size="md"
              />
            )}

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] px-4 py-2.5 rounded-full border border-[var(--border)] transition-colors duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {shareNotice ? 'Link copiado' : 'Compartir'}
            </button>
          </div>

          {/* Content tabs */}
          <div ref={contentRef} className="mt-10">
            <div className="pct">
              <Tabs tabs={PROFILE_TABS} active={tab} onChange={setTab} className="mb-6" />
            </div>

            {tab === 'sets' && (
              <div className="pct">
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

            {tab === 'fotos' && (
              <div className="pct">
                {profile.photos && profile.photos.length > 0 ? (
                  <ProfilePhotoGrid photos={profile.photos} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <p className="font-sans text-sm text-[var(--text-muted)]">
                      {isOwner
                        ? 'Agrega fotos desde la edicion de perfil para decorar tu espacio.'
                        : 'Sin fotos publicadas todavia.'}
                    </p>
                    {isOwner && (
                      <Link to="/profile/edit">
                        <Button variant="outline" size="sm">Agregar fotos</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'events' && (
              <div className="pct">
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

            {tab === 'comments' && (
              <div className="pct">
                <ProfileComments profileId={profileMongoId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
