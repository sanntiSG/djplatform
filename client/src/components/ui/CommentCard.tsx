import { cn } from '../../utils/cn.js'

interface CommentCardProps {
  avatarUrl?: string
  author: string
  role?: string
  text: string
  time?: string
  likes?: number
  className?: string
}

/* Social/quote card — inspired by reference feed posts (Sabrina Carpenter style) */
export function CommentCard({ avatarUrl, author, role, text, time, likes, className }: CommentCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4',
        className,
      )}
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={author}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] shrink-0 flex items-center justify-center border border-[var(--border)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M3 20c0-4 4-7 9-7s9 3 9 7" />
            </svg>
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-display font-semibold text-sm text-[var(--text)] truncate tracking-tight leading-none">
            {author}
          </span>
          {role && (
            <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{role}</span>
          )}
        </div>
        {time && (
          <span className="font-sans text-xs text-[var(--text-muted)] ml-auto shrink-0">{time}</span>
        )}
      </div>

      {/* Quote text */}
      <p className="font-sans text-sm text-[var(--text)] leading-relaxed">
        {text}
      </p>

      {/* Footer */}
      {likes !== undefined && (
        <div className="flex items-center gap-4 pt-1 border-t border-[var(--border)]">
          <button
            type="button"
            className="flex items-center gap-1.5 font-sans text-xs text-[var(--text-muted)] hover:text-[var(--c-pink)] transition-colors duration-150 group"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="group-hover:scale-110 transition-transform duration-150"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likes}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 font-sans text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Responder
          </button>
        </div>
      )}
    </div>
  )
}
