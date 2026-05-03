import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAdminProfiles,
  useAdminSetProfileVisibility,
  useAdminDeleteProfile,
} from '../../hooks/useAdmin.js'
import { Button } from '../../components/ui/Button.js'
import { Pill } from '../../components/ui/Pill.js'
import { cn } from '../../utils/cn.js'
import { profilePath } from '../../utils/slug.js'
import type { ProfileResponse } from '../../types/index.js'

type VisibilityFilter = 'all' | 'true' | 'false'

const FILTER_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Visibles' },
  { value: 'false', label: 'Ocultos' },
]

function ProfileRow({ profile }: { profile: ProfileResponse }) {
  const setVisibility = useAdminSetProfileVisibility()
  const deleteProfile = useAdminDeleteProfile()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    deleteProfile.mutate(profile.id)
    setConfirming(false)
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.artistName} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center font-display text-sm text-[var(--text-muted)]">
            {profile.artistName.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={profilePath(profile.slug, profile.id)}
            target="_blank"
            className="font-sans text-sm font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors truncate"
          >
            {profile.artistName}
          </Link>
          <Pill label={profile.type.toUpperCase()} variant="default" />
        </div>
        {profile.location && (
          <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">{profile.location}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            profile.isVisible ? 'bg-emerald-400' : 'bg-red-400',
          )}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVisibility.mutate({ id: profile.id, isVisible: !profile.isVisible })}
          loading={setVisibility.isPending && setVisibility.variables?.id === profile.id}
        >
          {profile.isVisible ? 'Ocultar' : 'Mostrar'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={deleteProfile.isPending && deleteProfile.variables === profile.id}
          className={confirming ? 'text-red-400 hover:text-red-300' : 'text-[var(--text-muted)]'}
        >
          {confirming ? 'Confirmar' : 'Eliminar'}
        </Button>
        {confirming && (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

export default function AdminProfiles() {
  const [filter, setFilter] = useState<VisibilityFilter>('all')
  const { data: profiles, isLoading } = useAdminProfiles(filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors duration-150',
                filter === opt.value
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="font-sans text-xs text-[var(--text-muted)]">
          {profiles?.length ?? 0} perfiles
        </span>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !profiles?.length ? (
          <p className="text-center font-sans text-sm text-[var(--text-muted)] py-16">
            No hay perfiles
          </p>
        ) : (
          profiles.map((profile) => <ProfileRow key={profile.id} profile={profile} />)
        )}
      </div>
    </div>
  )
}
