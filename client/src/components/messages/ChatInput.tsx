import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../../utils/motion.js'
import { cn } from '../../utils/cn.js'

interface Props {
  onSend: (body: string) => void
  disabled?: boolean
  onTypingStart?: () => void
  onTypingStop?: () => void
}

export function ChatInput({ onSend, disabled, onTypingStart, onTypingStop }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendRef = useRef<HTMLButtonElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)

    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTypingStart?.()
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTypingStop?.()
    }, 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const body = value.trim()
    if (!body || disabled) return

    // Spring press on send button
    const btn = sendRef.current
    if (btn && !prefersReducedMotion()) {
      gsap.timeline()
        .to(btn, { scale: 0.88, duration: DURATION.tap, ease: EASE.out })
        .to(btn, { scale: 1, duration: DURATION.base, ease: EASE.pop })
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (isTypingRef.current) { isTypingRef.current = false; onTypingStop?.() }

    onSend(body)
    setValue('')
  }

  const hasContent = value.trim().length > 0

  return (
    <div className={cn(
      'flex items-end gap-2 px-3 py-3',
      'bg-[var(--surface)] border-t border-white/5',
    )}>
      <div className="flex-1 min-w-0 flex items-end bg-[var(--surface-elevated)] rounded-full px-4 py-2.5 backdrop-blur-sm">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-[var(--text)] placeholder:text-white/30 outline-none leading-relaxed max-h-32 overflow-y-auto"
        />
      </div>
      <button
        ref={sendRef}
        type="button"
        onClick={submit}
        disabled={!hasContent || disabled}
        className={cn(
          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
          hasContent
            ? 'bg-[var(--accent)] text-[var(--bg)]'
            : 'bg-[var(--surface-elevated)] text-white/20',
        )}
        aria-label="Enviar mensaje"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>
  )
}
