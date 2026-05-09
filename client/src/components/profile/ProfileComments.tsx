import { useAuthStore } from '../../store/useAuthStore.js'
import {
  useProfileComments,
  usePostProfileComment,
  useDeleteProfileComment,
  useEditProfileComment,
  useToggleProfileCommentLike,
} from '../../hooks/useProfileSocial.js'
import { CommentThread } from '../social/CommentThread.js'
import type { ThreadComment } from '../social/CommentThread.js'

interface ProfileCommentsProps {
  profileId: string
  ownerUserId?: string
}

export function ProfileComments({ profileId, ownerUserId }: ProfileCommentsProps) {
  const { user, token } = useAuthStore()
  const { data: rawComments = [], isLoading } = useProfileComments(profileId)
  const postComment = usePostProfileComment(profileId)
  const deleteComment = useDeleteProfileComment(profileId)
  const editComment = useEditProfileComment(profileId)
  const likeComment = useToggleProfileCommentLike(profileId)

  const comments = rawComments as unknown as ThreadComment[]

  async function handlePost(text: string) {
    await postComment.mutateAsync(text)
  }

  async function handleEdit(commentId: string, text: string) {
    await editComment.mutateAsync({ commentId, text })
  }

  return (
    <CommentThread
      comments={comments}
      isLoading={isLoading}
      isLoggedIn={Boolean(token)}
      currentUserId={user?.id}
      ownerUserId={ownerUserId}
      onPost={handlePost}
      onEdit={handleEdit}
      onDelete={(id) => deleteComment.mutate(id)}
      onLike={(id) => likeComment.mutate(id)}
      variant="inline"
    />
  )
}
