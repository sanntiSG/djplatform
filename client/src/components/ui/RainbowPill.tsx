import { useRef } from 'react'
import gsap from 'gsap'
import { cn } from '../../utils/cn.js'
import { type RainbowColor, COLOR_VAR, COLOR_MUTED_VAR } from '../../utils/colors.js'

interface RainbowPillProps {
  label: string
  color: RainbowColor
  active?: boolean
  count?: number
  onClick?: () => void
  className?: string
}

export function RainbowPill({ label, color, active = false, count, onClick, className }: RainbowPillProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { scale: 0.88 }, { scale: 1, duration: 0.38, ease: 'back.out(2)' })
    onClick?.()
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        'rpill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-sans font-semibold text-xs shrink-0 transition-all duration-200 cursor-pointer select-none',
        active && 'rpill-active',
        className,
      )}
      style={{
        backgroundColor: active ? COLOR_MUTED_VAR[color] : 'rgba(255,255,255,0.04)',
        borderColor: active ? COLOR_VAR[color] : 'rgba(255,255,255,0.08)',
        color: active ? COLOR_VAR[color] : 'var(--text-muted)',
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200"
        style={{
          backgroundColor: COLOR_VAR[color],
          opacity: active ? 1 : 0.5,
          transform: active ? 'scale(1)' : 'scale(0.7)',
        }}
      />
      {label}
      {count !== undefined && (
        <span
          className="font-sans font-normal text-[10px] opacity-60 ml-0.5"
        >
          {count}
        </span>
      )}
    </button>
  )
}
