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
import { EventCard } from '../components/events/EventCard.js'
import { WhatsAppButton } from '../components/ui/WhatsAppButton.js'
import { Pill } from '../components/ui/Pill.js'
import { Tabs } from '../components/ui/Tabs.js'
import { Button } from '../components/ui/Button.js'
import { ProfileComments } from '../components/profile/ProfileComments.js'
import { ProfileFeed } from '../components/profile/ProfileFeed.js'
import { ProfileMusicTab } from '../components/profile/ProfileMusicTab.js'
import { ProfileMediaTab } from '../components/profile/ProfileMediaTab.js'
import { ContentViewer } from '../components/profile/viewer/ContentViewer.js'
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
  {
    id: 'feed',
    label: 'Feed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'musica',
    label: 'Musica',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'media',
    label: 'Media',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
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
  const [tab, setTab] = useState('feed')
  const [shareNotice, setShareNotice] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [viewerItem, setViewerItem] = useState<{ kind: 'photo' | 'media' | 'event'; id: string } | null>(null)
  const [viewerOrigin, setViewerOrigin] = useState<DOMRect | null>(null)
  const scopeRef = useRef<HTMLDivElement>(null)
  const commentsRef = useRef<HTMLDivElement>(null)

  const profileMongoId = id ? id.match(/[0-9a-fA-F]{24}$/)?.[0] ?? '' : ''
  const { data: social } = useProfileSocial(profileMongoId)
  const { mutate: toggleFollow, isPending: followPending } = useFollow(profileMongoId)
  const { mutate: toggleLike, isPending: likePending } = useProfileLike(profileMongoId)

  const theme: ProfileTheme = (profile?.theme as ProfileTheme) ?? 'minimal'
  const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  const profileAccent = profile?.accentColor || themeConfig.particle

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

    return () => { document.title = 'DJPlatform' }
  }, [profile])

  useEffect(() => {
    if (!profile || !scopeRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.pi', {
        y: 22,
        opacity: 0,
        duration: 0.75,
        stagger: 0.07,
        ease: 'expo.out',
        delay: 0.1,
      })
    }, scopeRef)
    return () => ctx.revert()
  }, [profile])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.artistName ?? 'DJPlatform', url })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareNotice(true)
      setTimeout(() => setShareNotice(false), 2000)
    }
  }, [profile])

  function scrollToComments() {
    setCommentsOpen(true)
    setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleOpenViewer = (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => {
    setViewerOrigin(rect)
    setViewerItem(item)
  }

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
        <Link to="/"><Button variant="outline" size="md">Volver al inicio</Button></Link>
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

      {/* HERO */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(220px, 50vh, 640px)' }}
      >
        <ThemeBackground theme={theme} />

        {profile.coverImage && (
          <div className="absolute inset-0">
            <img
              src={profile.coverImage}
              alt="Portada"
              className="w-full h-full object-cover"
              style={{ opacity: 0.45, filter: 'brightness(0.55)' }}
            />
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: '62%', background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 110% 70% at 50% 0%, transparent 38%, rgba(0,0,0,0.5) 100%)' }}
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

        {/* Desktop: identidad flotando en el hero */}
        <div className="hidden lg:flex absolute inset-0 items-end justify-center z-10" style={{ paddingBottom: 56 }}>
          <div className="max-w-4xl w-full px-8 flex flex-col items-center text-center gap-4">
            <div className="pi" style={{ filter: `drop-shadow(0 0 48px ${profileAccent}3a)` }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.artistName}
                  className="rounded-full object-cover"
                  style={{ width: 156, height: 156, border: '5px solid var(--bg)' }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 156, height: 156, background: `${profileAccent}1c`, border: '5px solid var(--bg)' }}
                >
                  <span className="font-display font-bold" style={{ fontSize: 56, color: profileAccent }}>
                    {profile.artistName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <h1
                className="pi font-display font-semibold text-[var(--text)] leading-none"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
              >
                {profile.artistName}
              </h1>
              <div className="pi flex items-center gap-2 flex-wrap justify-center">
                <span className="font-sans text-sm text-[var(--text-muted)]">
                  {TYPE_LABEL[profile.type] ?? profile.type}
                </span>
                {profile.location && (
                  <>
                    <span className="text-[var(--text-muted)] opacity-40">·</span>
                    <span className="font-sans text-sm text-[var(--text-muted)]">{profile.location}</span>
                  </>
                )}
                <Pill
                  label={AVAILABILITY_LABEL[profile.availability]}
                  variant={AVAILABILITY_VARIANT[profile.availability]}
                />
              </div>
            </div>

            <div className="pi flex items-center justify-center gap-0">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-0.5 px-8">
                    <span
                      className="font-display font-semibold text-[var(--text)] leading-none"
                      style={{ fontSize: 32 }}
                    >
                      {stat.value}
                    </span>
                    <span
                      className="font-sans uppercase tracking-widest text-[var(--text-muted)]"
                      style={{ fontSize: 9 }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="h-10 bg-[var(--border)]" style={{ width: 1 }} />
                  )}
                </div>
              ))}
            </div>

            {profile.genres.length > 0 && (
              <div className="pi flex flex-wrap gap-1.5 justify-center">
                {profile.genres.slice(0, 6).map((g) => (
                  <Pill key={g} label={g} variant="default" />
                ))}
              </div>
            )}

            <div className="pi flex flex-wrap items-center justify-center gap-2">
              {token && !isOwner && (
                <button
                  type="button"
                  disabled={followPending}
                  onClick={() => toggleFollow()}
                  className="font-sans text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-150 disabled:opacity-50 active:scale-95"
                  style={
                    social?.isFollowing
                      ? { background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)' }
                      : { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: 'var(--bg)' }
                  }
                >
                  {social?.isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
              {profile.whatsapp && (
                <WhatsAppButton
                  number={profile.whatsapp}
                  message={`Hola ${profile.artistName}! Te escribo desde DJPlatform, me interesa contactarte.`}
                  size="md"
                />
              )}
              {token && !isOwner && (
                <button
                  type="button"
                  disabled={likePending}
                  onClick={() => toggleLike()}
                  className="flex items-center gap-1.5 font-sans text-sm px-4 py-2.5 rounded-full border border-[var(--border)] transition-all duration-150 disabled:opacity-50 active:scale-95"
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
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] px-4 py-2.5 rounded-full border border-[var(--border)] transition-colors duration-150 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>{shareNotice ? 'Copiado' : 'Compartir'}</span>
              </button>
              <button
                type="button"
                onClick={scrollToComments}
                className="flex items-center gap-1.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] px-4 py-2.5 rounded-full border border-[var(--border)] transition-colors duration-150 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {commentCount > 0 && <span>{commentCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE INFO */}
      <div ref={scopeRef}>

        {/* Mobile / tablet: info vertical debajo del hero */}
        <div className="lg:hidden">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">

          {/* Avatar */}
          <div className="pi flex justify-center md:justify-start" style={{ marginTop: '-54px', marginBottom: 16 }}>
            <div style={{ filter: `drop-shadow(0 0 32px ${profileAccent}2e)` }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.artistName}
                  className="rounded-full object-cover"
                  style={{ width: 108, height: 108, border: '4px solid var(--bg)' }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 108, height: 108, background: `${profileAccent}1c`, border: '4px solid var(--bg)' }}
                >
                  <span className="font-display font-bold" style={{ fontSize: 40, color: profileAccent }}>
                    {profile.artistName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Identity */}
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <h1
              className="pi font-display font-semibold text-[var(--text)] leading-none"
              style={{ fontSize: 'clamp(1.85rem, 5vw, 2.75rem)' }}
            >
              {profile.artistName}
            </h1>
            <div className="pi flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span className="font-sans text-sm text-[var(--text-muted)]">
                {TYPE_LABEL[profile.type] ?? profile.type}
              </span>
              {profile.location && (
                <>
                  <span className="text-[var(--text-muted)] opacity-40">·</span>
                  <span className="font-sans text-sm text-[var(--text-muted)]">{profile.location}</span>
                </>
              )}
              <Pill
                label={AVAILABILITY_LABEL[profile.availability]}
                variant={AVAILABILITY_VARIANT[profile.availability]}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="pi flex items-center justify-center md:justify-start gap-0 mt-5">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                <div className="flex flex-col items-center md:items-start gap-0.5 px-5 first:pl-0">
                  <span
                    className="font-display font-semibold text-[var(--text)] leading-none"
                    style={{ fontSize: 22 }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="font-sans uppercase tracking-widest text-[var(--text-muted)]"
                    style={{ fontSize: 9 }}
                  >
                    {stat.label}
                  </span>
                </div>
                {i < stats.length - 1 && (
                  <div className="h-8 bg-[var(--border)]" style={{ width: 1 }} />
                )}
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p
              className="pi font-sans text-sm leading-relaxed mt-4 text-center md:text-left"
              style={{ color: 'rgba(242,242,247,0.70)', maxWidth: '54ch' }}
            >
              {profile.bio}
            </p>
          )}

          {/* Genre pills */}
          {profile.genres.length > 0 && (
            <div className="pi flex flex-wrap gap-1.5 mt-3 justify-center md:justify-start">
              {profile.genres.map((g) => (
                <Pill key={g} label={g} variant="default" />
              ))}
            </div>
          )}

          {/* Action row */}
          <div className="pi flex flex-wrap items-center justify-center md:justify-start gap-2 mt-6">
            {token && !isOwner && (
              <button
                type="button"
                disabled={followPending}
                onClick={() => toggleFollow()}
                className="font-sans text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-150 disabled:opacity-50 active:scale-95"
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

            {profile.whatsapp && (
              <WhatsAppButton
                number={profile.whatsapp}
                message={`Hola ${profile.artistName}! Te escribo desde DJPlatform, me interesa contactarte.`}
                size="md"
              />
            )}

            {token && !isOwner && (
              <button
                type="button"
                disabled={likePending}
                onClick={() => toggleLike()}
                className="flex items-center gap-1.5 font-sans text-sm px-4 py-2.5 rounded-full border border-[var(--border)] transition-all duration-150 disabled:opacity-50 active:scale-95"
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

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] px-4 py-2.5 rounded-full border border-[var(--border)] transition-colors duration-150 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span className="hidden sm:inline">{shareNotice ? 'Copiado' : 'Compartir'}</span>
            </button>

            <button
              type="button"
              onClick={scrollToComments}
              className="flex items-center gap-1.5 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] px-4 py-2.5 rounded-full border border-[var(--border)] transition-colors duration-150 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {commentCount > 0 && <span className="hidden sm:inline">{commentCount}</span>}
            </button>
          </div>
        </div>
        </div>{/* /lg:hidden */}

        {/* Desktop: bio debajo del hero */}
        {profile.bio && (
          <div className="hidden lg:block max-w-2xl mx-auto px-5 pt-8 pb-2 text-center">
            <p
              className="pi font-sans text-sm leading-relaxed"
              style={{ color: 'rgba(242,242,247,0.70)' }}
            >
              {profile.bio}
            </p>
          </div>
        )}

        {/* STICKY TABS */}
        <div
          className="sticky z-30 mt-8 -mx-0"
          style={{
            top: 64,
            background: 'rgba(8,8,10,0.78)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <Tabs
              variant="instagram"
              tabs={PROFILE_TABS}
              active={tab}
              onChange={setTab}
            />
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-8">
          {tab === 'feed' && (
            <ProfileFeed
              profile={profile}
              events={events ?? []}
              onItemClick={handleOpenViewer}
            />
          )}

          {tab === 'musica' && (
            <ProfileMusicTab
              profile={profile}
              isOwner={isOwner}
              onItemClick={handleOpenViewer}
            />
          )}

          {tab === 'media' && (
            <ProfileMediaTab
              profile={profile}
              isOwner={isOwner}
              onItemClick={handleOpenViewer}
            />
          )}

          {tab === 'events' && (
            <>
              {events && events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
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
            </>
          )}
        </div>

        {/* COMMENTS — collapsible section */}
        <div ref={commentsRef} className="max-w-3xl mx-auto px-5 sm:px-8 pb-24">
          <div className="border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setCommentsOpen((v) => !v)}
              className="flex items-center justify-between w-full group"
            >
              <span
                className="font-sans font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-150"
                style={{ fontSize: 13 }}
              >
                Comentarios
                {commentCount > 0 && (
                  <span className="ml-1.5 text-[var(--text-muted)]">({commentCount})</span>
                )}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--text-muted)] transition-transform duration-200"
                style={{ transform: commentsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {commentsOpen && (
              <div className="mt-6">
                <ProfileComments profileId={profileMongoId} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* VIEWER MODAL */}
      {viewerItem && (
        <ContentViewer
          profile={profile}
          events={events ?? []}
          initialItem={viewerItem}
          originRect={viewerOrigin}
          onClose={() => setViewerItem(null)}
        />
      )}
    </div>
  )
}
