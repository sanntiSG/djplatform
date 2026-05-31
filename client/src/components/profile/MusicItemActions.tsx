/**
 * MusicItemActions — inline like + save buttons shown below each track
 * in ProfileMusicTab. Shares the exact same React Query keys as the
 * expanded ContentViewerHUD, guaranteeing bidirectional sync.
 */
import { LikeButton } from '../ui/LikeButton.js'
import { SaveButton } from '../ui/SaveButton.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { useProfileContentSocial, useToggleContentLike } from '../../hooks/useContentSocial.js'
import { useIsSaved, useToggleSaveMedia } from '../../hooks/useSavedMedia.js'
import type { MediaItem } from '../../types/index.js'

interface MusicItemActionsProps {
  profileId: string
  item: MediaItem
  accentColor?: string
}

export function MusicItemActions({ profileId, item, accentColor }: MusicItemActionsProps) {
  const { token } = useAuthStore()
  const { data: socialMap } = useProfileContentSocial(profileId)

  const mediaId = item.id ?? ''
  const key = `media:${mediaId}`
  const stats = socialMap?.[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }

  const { mutate: toggleLike, isPending: liking } = useToggleContentLike(profileId, 'media', mediaId)
  const { mutate: toggleSave, isPending: saving } = useToggleSaveMedia(profileId, mediaId)
  const isSaved = useIsSaved(mediaId)

  if (!token || !mediaId) return null

  return (
    <div
      className="flex items-center gap-5 pt-2"
      onClick={(e) => e.stopPropagation()}
      data-no-swipe
    >
      <LikeButton
        isLiked={stats.isLiked}
        likeCount={stats.likeCount > 0 ? stats.likeCount : undefined}
        onToggle={() => toggleLike()}
        disabled={liking}
        accentColor={accentColor}
        size="sm"
        layout="row"
      />
      <SaveButton
        isSaved={isSaved}
        onToggle={() => toggleSave()}
        disabled={saving}
        accentColor={accentColor}
        size="sm"
        layout="row"
      />
    </div>
  )
}
