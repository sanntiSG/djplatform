import { Link } from 'react-router-dom'
import { MediaList } from '../media/MediaList.js'
import { MusicItemActions } from './MusicItemActions.js'
import { Button } from '../ui/Button.js'
import type { ProfileResponse } from '../../types/index.js'

interface ProfileMusicTabProps {
  profile: ProfileResponse
  isOwner: boolean
  onItemClick: (item: { kind: 'photo' | 'media' | 'event'; id: string }, rect: DOMRect) => void
}

export function ProfileMusicTab({ profile, isOwner, onItemClick }: ProfileMusicTabProps) {
  const musicItems = [...profile.media].sort(
    (a, b) => new Date(b.addedAt ?? 0).getTime() - new Date(a.addedAt ?? 0).getTime(),
  )

  if (musicItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
        <p className="font-sans text-sm text-[var(--text-muted)] text-center">
          {isOwner ? 'Agrega musica desde la edicion de perfil.' : 'Sin musica publicada todavia.'}
        </p>
        {isOwner && (
          <Link to="/profile/edit">
            <Button variant="outline" size="sm">Agregar musica</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <MediaList
      items={musicItems}
      onItemClick={onItemClick}
      renderActions={(item) => (
        <MusicItemActions
          profileId={profile.id}
          item={item}
          accentColor={profile.accentColor}
        />
      )}
    />
  )
}
