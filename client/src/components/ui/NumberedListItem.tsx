import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { type RainbowColor, COLOR_VAR, COLOR_MUTED_VAR } from '../../utils/colors.js'

interface NumberedListItemProps {
  rank: number
  thumbUrl?: string
  title: string
  subtitle?: string
  meta?: string
  color: RainbowColor
  href?: string
  onClick?: () => void
  className?: string
}

/* Ranked list row — inspired by reference "Top B" list with numbered gradient cards */
export function NumberedListItem({
  rank,
  thumbUrl,
  title,
  subtitle,
  meta,
  color,
  href,
  onClick,
  className,
}: NumberedListItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 6, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
  }
  const handleLeave = () => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 0, duration: 0.45, ease: 'elastic.out(1,0.6)', overwrite: 'auto' })
  }

  const inner = (
    <div
      ref={ref}
      className={cn(
        'nl-item group relative flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] cursor-pointer transition-colors duration-150',
        className,
      )}
      style={{ backgroundColor: COLOR_MUTED_VAR[color] }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {/* Rank number */}
      <span
        className="font-display font-bold leading-none shrink-0 select-none"
        style={{
          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          color: COLOR_VAR[color],
          minWidth: '2ch',
          letterSpacing: '-0.04em',
        }}
      >
        {rank}
      </span>

      {/* Thumbnail */}
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={title}
          className="w-12 h-12 rounded-[var(--radius-sm)] object-cover shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-[var(--radius-sm)] shrink-0 flex items-center justify-center"
          style={{ backgroundColor: COLOR_MUTED_VAR[color] }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLOR_VAR[color]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M3 20c0-4 4-7 9-7s9 3 9 7" />
          </svg>
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-display font-semibold text-sm text-[var(--text)] truncate leading-tight tracking-tight">
          {title}
        </span>
        {subtitle && (
          <span className="font-sans text-xs text-[var(--text-muted)] truncate">{subtitle}</span>
        )}
      </div>

      {/* Meta / right slot */}
      {meta && (
        <span className="font-sans text-xs text-[var(--text-muted)] shrink-0 ml-auto">{meta}</span>
      )}

      {/* Arrow indicator */}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={COLOR_VAR[color]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  )

  if (href) return <Link to={href} className="block">{inner}</Link>
  return inner
}
