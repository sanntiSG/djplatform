import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import gsap from 'gsap'
import { profileService, type SuggestionResult } from '../../services/profileService.js'
import { conversationsService } from '../../services/conversationsService.js'
import { profilePath } from '../../utils/slug.js'
import { prefersReducedMotion } from '../../utils/motion.js'

const ROLE_LABEL: Record<string, string> = {
  dj: 'DJ',
  producer: 'Prod',
  vocalist: 'Voc',
  designer: 'Dis',
  organizer: 'Org',
  visuals: 'VJ',
}

function SuggestionCard({ suggestion, onSaludar }: {
  suggestion: SuggestionResult
  onSaludar: (userId: string, artistName: string) => void
}) {
  return (
    <div
      className="suggestion-card flex-shrink-0 flex flex-col rounded-[20px] overflow-hidden"
      style={{
        width: 'clamp(156px, 40vw, 180px)',
        scrollSnapAlign: 'start',
        background: 'var(--surface-elevated)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Avatar + link */}
      <Link
        to={profilePath(suggestion.slug, suggestion.id)}
        className="block relative"
        style={{ aspectRatio: '1/1' }}
      >
        {suggestion.avatar ? (
          <img
            src={suggestion.avatar}
            alt={suggestion.artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--surface)' }}
          >
            <span className="font-display font-bold text-3xl text-[var(--border)]">
              {suggestion.artistName.charAt(0)}
            </span>
          </div>
        )}
        {suggestion.openToWork && (
          <span
            className="absolute bottom-2 left-2 font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Open
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <Link
          to={profilePath(suggestion.slug, suggestion.id)}
          className="font-display font-semibold text-[var(--text)] leading-tight hover:text-[var(--accent)] transition-colors duration-150"
          style={{ fontSize: 'clamp(0.82rem, 2.8vw, 0.95rem)' }}
        >
          {suggestion.artistName}
        </Link>

        {/* Roles */}
        {suggestion.roles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.roles.slice(0, 2).map((r) => (
              <span
                key={r}
                className="font-sans text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(212,255,0,0.08)', color: 'var(--accent)' }}
              >
                {ROLE_LABEL[r] ?? r}
              </span>
            ))}
          </div>
        )}

        {/* Reason */}
        {suggestion.reason && (
          <p
            className="font-sans text-[var(--text-muted)] leading-tight"
            style={{ fontSize: '10px' }}
          >
            {suggestion.reason}
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => onSaludar(suggestion.userId, suggestion.artistName)}
          className="mt-auto w-full font-sans font-semibold text-[10px] uppercase tracking-wider rounded-full py-1.5 transition-all duration-150 active:scale-[0.97]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,255,0,0.1)'
            e.currentTarget.style.borderColor = 'rgba(212,255,0,0.3)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'var(--text)'
          }}
        >
          Saludar
        </button>
      </div>
    </div>
  )
}

function SuggestionSkeleton() {
  return (
    <div
      className="flex-shrink-0 rounded-[20px] overflow-hidden animate-pulse"
      style={{
        width: 'clamp(156px, 40vw, 180px)',
        background: 'var(--surface-elevated)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.04)' }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-2 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-7 rounded-full w-full mt-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

export function SuggestionsRail() {
  const railRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['profile', 'suggestions'],
    queryFn: () => profileService.getSuggestions(8),
    staleTime: 30 * 60 * 1000,
  })

  const startConversation = useMutation({
    mutationFn: (targetUserId: string) => conversationsService.start(targetUserId),
    onSuccess: (data) => {
      setLoadingId(null)
      navigate(`/me/mensajes/${data._id}`)
    },
    onError: () => setLoadingId(null),
  })

  function handleSaludar(userId: string, artistName: string) {
    if (loadingId) return
    setLoadingId(userId)
    startConversation.mutate(userId)
  }

  useEffect(() => {
    if (!suggestions?.length || !railRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      railRef.current.querySelectorAll('.suggestion-card'),
      { opacity: 0, x: 24 },
      {
        opacity: 1,
        x: 0,
        duration: 0.48,
        ease: 'expo.out',
        stagger: 0.055,
        clearProps: 'transform,opacity',
      },
    )
  }, [suggestions])

  if (!isLoading && (!suggestions || suggestions.length === 0)) return null

  return (
    <section>
      <div className="px-4 md:px-6 flex items-center justify-between mb-4">
        <div>
          <p className="feed-section-head font-sans font-bold text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] mb-0.5">
            Para colaborar
          </p>
          <h2 className="feed-section-head font-display font-semibold text-[var(--text)] tracking-tight" style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.45rem)' }}>
            Podria interesarte
          </h2>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SuggestionSkeleton key={i} />)
          : suggestions?.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onSaludar={handleSaludar}
            />
          ))
        }
      </div>
    </section>
  )
}
