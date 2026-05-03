import { cn } from '../../utils/cn.js'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated = false, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-lg border border-[var(--border)]',
        elevated ? 'bg-[var(--surface-elevated)]' : 'bg-[var(--surface)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
