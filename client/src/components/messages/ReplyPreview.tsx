import type { MessageItem } from '../../services/conversationsService.js'

interface Props {
  message: MessageItem
  onClose: () => void
}

export function ReplyPreview({ message, onClose }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] border-t border-white/5">
      <div className="w-0.5 h-8 bg-[var(--accent)] rounded-full shrink-0" />
      <p className="text-xs text-[var(--text-muted)] line-clamp-1 flex-1 min-w-0">
        {message.body}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-white/40 hover:text-white transition-colors"
        aria-label="Cancelar respuesta"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
