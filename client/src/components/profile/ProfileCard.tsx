import { Link } from 'react-router-dom'
import { Pill } from '../ui/Pill.js'
import { cn } from '../../utils/cn.js'
import { profilePath } from '../../utils/slug.js'
import type { ProfileResponse, Availability } from '../../types/index.js'

const availabilityVariant: Record<Availability, 'available' | 'contact' | 'unavailable'> = {
  available: 'available',
  contact: 'contact',
  unavailable: 'unavailable',
}

const availabilityLabel: Record<Availability, string> = {
  available: 'Disponible',
  contact: 'Consultar',
  unavailable: 'No disponible',
}

const typeLabel: Record<string, string> = {
  dj: 'DJ',
  producer: 'Productor',
  other: 'Artista',
}

interface ProfileCardProps {
  profile: ProfileResponse
  className?: string
}

export function ProfileCard({ profile, className }: ProfileCardProps) {
  return (
    <Link
      to={profilePath(profile.slug, profile.id)}
      className={cn(
        'group block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden',
        'hover:border-white/15 transition-colors duration-200',
        className,
      )}
    >
      <div className="relative h-44 overflow-hidden bg-[var(--surface-elevated)]">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.artistName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="font-display font-semibold text-5xl text-[var(--border)]"
            >
              {profile.artistName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Pill label={typeLabel[profile.type] ?? profile.type} variant="default" />
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-[var(--text)] text-lg leading-tight line-clamp-1">
            {profile.artistName}
          </h3>
          <Pill
            label={availabilityLabel[profile.availability]}
            variant={availabilityVariant[profile.availability]}
          />
        </div>

        {profile.location && (
          <p className="text-xs text-[var(--text-muted)] font-sans">{profile.location}</p>
        )}

        {profile.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.genres.slice(0, 3).map((g) => (
              <Pill key={g} label={g} variant="default" />
            ))}
            {profile.genres.length > 3 && (
              <Pill label={`+${profile.genres.length - 3}`} variant="default" />
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
