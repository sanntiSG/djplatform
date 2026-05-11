import { useRef } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { type RainbowColor, COLOR_VAR } from '../../utils/colors.js'

interface ColorBlockCardProps {
  color: RainbowColor
  title: string
  meta?: string
  badge?: string
  coverUrl?: string
  children?: React.ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

/* Solid-color editorial card — inspired by reference "Neon Nights", "New Week New Song" */
export function ColorBlockCard({
  color,
  title,
  meta,
  badge,
  coverUrl,
  children,
  onClick,
  className,
  style,
}: ColorBlockCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (!ref.current) return
    gsap.to(ref.current, { y: -5, duration: 0.32, ease: 'power2.out', overwrite: 'auto' })
  }
  const handleLeave = () => {
    if (!ref.current) return
    gsap.to(ref.current, { y: 0, duration: 0.55, ease: 'elastic.out(1,0.5)', overwrite: 'auto' })
  }

  return (
    <div
      ref={ref}
      className={cn('cbcard relative overflow-hidden rounded-[var(--radius-lg)] cursor-pointer select-none', className)}
      style={{
        background: `linear-gradient(145deg, ${COLOR_VAR[color]} 0%, oklch(from ${COLOR_VAR[color]} calc(l - 0.18) c h) 100%)`,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* cover image overlay */}
      {coverUrl && (
        <div className="absolute inset-0">
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover mix-blend-overlay opacity-30"
          />
        </div>
      )}

      {/* noise texture for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }}
      />

      <div className="relative z-10 p-5 flex flex-col h-full gap-2">
        {badge && (
          <span className="font-sans font-bold text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1">
            {badge}
          </span>
        )}
        <h3
          className="font-display font-semibold text-white leading-tight tracking-tight"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}
        >
          {title}
        </h3>
        {meta && (
          <p className="font-sans text-xs text-white/70 leading-relaxed">{meta}</p>
        )}
        {children && <div className="mt-auto">{children}</div>}
      </div>
    </div>
  )
}
