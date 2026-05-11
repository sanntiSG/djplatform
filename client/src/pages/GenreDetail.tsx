import { useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import gsap from 'gsap'
import { useTracksByGenre } from '../hooks/useTracksByGenre.js'
import { genreToColor, COLOR_VAR } from '../utils/colors.js'
import { prefersReducedMotion } from '../utils/motion.js'
import { profilePath } from '../utils/slug.js'

const N_PANELS = 12
const ROTATION_COEF = 5

function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'youtube') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500 flex-shrink-0">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
  if (platform === 'spotify') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0" style={{ color: '#1ed760' }}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0" style={{ color: '#ff5500' }}>
      <path d="M1.175 12.225C.528 12.225 0 12.75 0 13.39v.817c0 .632.528 1.165 1.175 1.165.637 0 1.174-.534 1.174-1.165v-.817c0-.641-.537-1.165-1.174-1.165m-.468 1.974v-.817c0-.257.213-.468.468-.468.262 0 .468.211.468.468v.817c0 .263-.206.468-.468.468-.255 0-.468-.205-.468-.468m3.701-1.791a.348.348 0 0 0-.348.347v2.016a.348.348 0 0 0 .696 0v-.678l.753-.003a.348.348 0 0 0 0-.697l-.753.003V12.1a.348.348 0 0 0-.348-.347m18.795.692a.348.348 0 0 0-.348.347v2.016a.348.348 0 0 0 .696 0v-2.016a.348.348 0 0 0-.348-.347M12 0C5.373 0 0 5.373 0 12h2.667c0-5.147 4.186-9.333 9.333-9.333S21.333 6.853 21.333 12H24C24 5.373 18.627 0 12 0" />
    </svg>
  )
}

function getTrackThumbnail(item: { platform: string; embedId?: string }) {
  if (item.platform === 'youtube' && item.embedId) {
    return `https://img.youtube.com/vi/${item.embedId}/mqdefault.jpg`
  }
  if (item.platform === 'spotify' && item.embedId) {
    const [type, id] = item.embedId.split('/')
    if (type === 'track') {
      return `https://i.scdn.co/image/${id}` 
    }
  }
  return null
}

export default function GenreDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data: tracks, isLoading } = useTracksByGenre(slug ?? '')

  const containerRef = useRef<HTMLDivElement>(null)
  const panel1Refs = useRef<HTMLDivElement[]>([])
  const panel2Refs = useRef<HTMLDivElement[]>([])
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const tracksRef = useRef<HTMLDivElement>(null)

  const displayName = slug ? slugToName(slug) : ''
  const color = genreToColor(displayName)
  const colorVar = COLOR_VAR[color]

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) {
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 1, xPercent: -50, left: '50%', visibility: 'visible' })
      }
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 })
      const elHeight = window.innerHeight / N_PANELS
      const elWidth = window.innerWidth / N_PANELS
      const panels = panel1Refs.current
      const secondaryPanels = panel2Refs.current

      const gradStart = `linear-gradient(105deg, ${colorVar} 0%, rgba(0,0,0,0.9) 70%, black 100%)`
      const gradFull = `linear-gradient(90deg, ${colorVar} 0%, rgba(0,0,0,0.8) 60%, black 100%)`

      // Ensure title is visible for animation and properly centered
      gsap.set(titleRef.current, { 
        visibility: 'visible', 
        autoAlpha: 1, 
        xPercent: -50, 
        yPercent: -50,
        left: '50%',
        top: '50%'
      })

      tl.fromTo(
        titleRef.current,
        { xPercent: 150, opacity: 0 },
        { xPercent: -50, opacity: 1, ease: 'expo.out', duration: 1.2, delay: 1.2 },
        0,
      )
      tl.to(titleRef.current, { yPercent: -150, delay: 3, duration: 0.6, ease: 'power2.inOut' }, 0)
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30, xPercent: -50, left: '50%' },
        { opacity: 1, y: 0, ease: 'sine.out', duration: 0.5, delay: 3.2 },
        0,
      )
      tl.to([titleRef.current, subtitleRef.current], { xPercent: -250, opacity: 0, ease: 'sine.in', duration: 1, delay: 1.2 }, 4)

      panels.forEach((panel, i) => {
        const wi = window.innerWidth - elWidth * (N_PANELS - i) + elWidth
        const he = window.innerHeight - elHeight * (N_PANELS - i) + elHeight

        tl.fromTo(
          panel,
          { y: elHeight * 5.5, x: elWidth * 5.5, width: 0, height: 0, rotation: -360, background: gradStart },
          {
            width: wi, height: he,
            y: -elHeight / 1.33 + ((N_PANELS - i) * elHeight) / 1.33,
            x: 0,
            duration: 1 + 0.1 * (N_PANELS - i),
            ease: 'sine.inOut',
            rotation: 0,
            background: gradStart,
          },
          0,
        )
        tl.to(panel, { rotation: N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF, duration: 3, background: gradFull, ease: 'linear' }, '>')
        tl.to(
          panel,
          {
            rotation: 360,
            y: -elHeight / 6 + ((N_PANELS - i) * elHeight) / 6,
            x: -elWidth / 1.2 + ((N_PANELS - i) * elWidth) / 1.2,
            background: gradFull,
            ease: 'sine.inOut',
            duration: 1,
          },
          '>',
        )
        tl.to(panel, { rotation: N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF + 360, duration: 4, background: gradFull, ease: 'linear' }, '>')

        if (i === 0) tl.addLabel('splitStart', '-=0.8')

        secondaryPanels.forEach((twoPanel, index) => {
          const wi2 = window.innerWidth - elWidth * index + elWidth
          tl.fromTo(
            twoPanel,
            { y: elHeight * 5.5, x: elWidth * 5.5, width: 0, height: 0, rotation: -360, background: gradStart },
            {
              rotation: -90,
              y: 0 + (index * elHeight) / 4 - wi2,
              x: -elWidth / 2 + (index * elWidth) / 2,
              width: wi2, height: wi2,
              background: gradFull,
              ease: 'sine.inOut',
              duration: 1,
            },
            `splitStart+=${0.05 * index}`,
          )
          tl.to(twoPanel, { rotation: N_PANELS * ROTATION_COEF - (N_PANELS - index) * ROTATION_COEF - 90, duration: 5, background: gradFull, ease: 'linear' }, '>')
          tl.to(
            twoPanel,
            {
              rotation: 300,
              y: 0 + (index * elHeight) / 2 - wi2,
              x: window.innerWidth * 1.1 - wi2 * 1.2,
              width: wi2, height: wi2,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            '>',
          )
          tl.to(twoPanel, { rotation: '+=15', duration: 5, background: gradFull, ease: 'linear' }, '>')
          tl.to(
            twoPanel,
            {
              rotation: '+=360',
              y: `-=${wi2 * 2}`,
              x: `+=${wi2 * 2}`,
              width: wi2, height: wi2,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            '>',
          )
        })

        if (i === 0) {
          tl.to(
            panel,
            {
              rotation: 720 + 90,
              y: window.innerHeight - ((N_PANELS - i) * elHeight) / 4,
              x: -elWidth / 2 + ((N_PANELS - i) * elWidth) / 2,
              width: 0, height: 0, opacity: 0,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            `splitStart+=${0.05 * i}`,
          )
        } else {
          tl.to(
            panel,
            {
              rotation: 720 + 90,
              y: window.innerHeight - ((N_PANELS - i) * elHeight) / 4,
              x: -elWidth / 2 + ((N_PANELS - i) * elWidth) / 2,
              width: wi, height: wi,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            `splitStart+=${0.05 * i}`,
          )
          tl.to(panel, { rotation: (N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 810, duration: 5, background: gradFull, ease: 'linear' }, '>')
          tl.to(
            panel,
            {
              y: window.innerHeight - ((N_PANELS - i) * elHeight) / 2,
              x: 0 - elWidth * 1.2,
              rotation: (N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1180,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            '>',
          )
          tl.to(panel, { rotation: (N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1200, duration: 5, background: gradFull, ease: 'linear' }, '>')
          tl.to(
            panel,
            {
              y: `+=${elHeight * 4}`,
              x: `-=${elWidth * 4}`,
              rotation: (N_PANELS * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1500,
              background: gradFull, ease: 'sine.inOut', duration: 1,
            },
            '>',
          )
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [colorVar])

  // Stagger-in track list
  useEffect(() => {
    if (!tracksRef.current || !tracks?.length || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.track-card', { y: 24, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'expo.out', delay: 0.1 })
    }, tracksRef)
    return () => ctx.revert()
  }, [tracks])

  const panel1Styles: React.CSSProperties[] = Array.from({ length: N_PANELS }, (_, i) => ({
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    zIndex: N_PANELS - i,
    background: `linear-gradient(105deg, ${colorVar} 0%, rgba(0,0,0,0.9) 70%, black ${99 - i}%)`,
  }))

  const panel2Styles: React.CSSProperties[] = Array.from({ length: N_PANELS }, (_, i) => ({
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: N_PANELS - i,
    background: `linear-gradient(105deg, ${colorVar} 0%, rgba(0,0,0,0.9) 70%, black ${99 - i}%)`,
  }))

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={{ overflowX: 'hidden' }}>
      {/* Hero — full screen animated panels */}
      <div
        ref={containerRef}
        className="relative w-screen overflow-hidden"
        style={{ height: '100svh', backgroundColor: '#000' }}
      >
        {panel1Styles.map((style, i) => (
          <div
            key={`p1-${i}`}
            ref={(el) => { if (el) panel1Refs.current[i] = el }}
            style={style}
          />
        ))}
        {panel2Styles.map((style, i) => (
          <div
            key={`p2-${i}`}
            ref={(el) => { if (el) panel2Refs.current[i] = el }}
            style={style}
          />
        ))}

        {/* Genre name */}
        <h1
          ref={titleRef}
          className="font-display font-black text-white text-center leading-[0.8] select-none pointer-events-none px-4"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            fontSize: 'clamp(3rem, 12vw, 10rem)',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '-0.05em',
            opacity: 1,
            visibility: 'visible',
            width: '100%',
          }}
        >
          {displayName}
        </h1>

        <p
          ref={subtitleRef}
          className="font-sans font-bold text-white/40 uppercase tracking-[0.4em] select-none pointer-events-none"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '6rem',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
            opacity: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? 'Explorando...' : `${tracks?.length ?? 0} piezas seleccionadas`}
        </p>

        {/* Scroll hint */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2"
          style={{ opacity: 0.5 }}
        >
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-white/50"></div>
          <span className="font-sans text-[9px] text-white/50 uppercase tracking-[0.2em]">Scroll</span>
        </div>
      </div>

      {/* Track list */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse bg-white/5"
              />
            ))}
          </div>
        ) : !tracks?.length ? (
          <div className="text-center py-24 glass rounded-[3rem] p-12 border-white/5">
            <h2 className="font-display font-semibold text-white text-3xl mb-4">
              Escena en silencio
            </h2>
            <p className="font-sans text-[var(--text-muted)] max-w-sm mx-auto">
              Ningún artista ha catalogado tracks como {displayName} aún.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="font-sans text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em] mb-3 block">
                  Catálogo musical
                </span>
                <h2 className="font-display font-bold text-white text-5xl md:text-6xl tracking-tight">
                  {displayName}
                </h2>
              </div>
              <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
                <p className="font-sans text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Escena actual</p>
                <p className="font-sans text-sm font-bold text-white">{tracks.length} Artistas participando</p>
              </div>
            </div>

            <div ref={tracksRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10">
              {tracks.map((item, i) => {
                const rawTitle = item.track.title ?? item.track.url;
                const displayTitle = rawTitle.length > 50 && !item.track.title 
                  ? `Track ${i + 1}` 
                  : rawTitle;
                const trackThumbnail = getTrackThumbnail(item.track);

                return (
                  <Link
                    key={i}
                    id={item.track.id}
                    to={`${profilePath(item.profile.slug, item.profile.id)}#${item.track.id}`}
                    className="track-card group flex flex-col"
                  >
                    {/* Cover Container */}
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white/5 mb-4 shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      {trackThumbnail ? (
                        <img 
                          src={trackThumbnail} 
                          alt={displayTitle} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : item.profile.avatar ? (
                        <img 
                          src={item.profile.avatar} 
                          alt={item.profile.artistName} 
                          className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display font-bold text-4xl" style={{ background: colorVar + '22', color: colorVar }}>
                          {item.profile.artistName.charAt(0)}
                        </div>
                      )}

                      {/* Hover Overlay with Platform Icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                            <PlatformIcon platform={item.track.platform} />
                         </div>
                      </div>

                      {/* Badge (Small) */}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg glass border-white/5 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: colorVar }}></div>
                        <span className="font-sans text-[8px] font-bold text-white uppercase tracking-wider">{item.track.platform}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="px-2">
                      <h3 className="font-sans font-bold text-white text-sm leading-tight line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                          {item.profile.avatar && <img src={item.profile.avatar} className="w-full h-full object-cover" />}
                        </div>
                        <p className="font-sans text-[10px] font-medium text-white/40 truncate uppercase tracking-widest">
                          {item.profile.artistName}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-20 text-center">
              <Link
                to={`/profiles?genre=${encodeURIComponent(displayName)}`}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-sans text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                style={{ background: colorVar, color: '#000' }}
              >
                Ver todos los artistas de {displayName}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
