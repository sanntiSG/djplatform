import { useAuthStore } from '../../../store/useAuthStore.js'
import {
  useContentComments,
  usePostContentComment,
  useDeleteContentComment,
  useEditContentComment,
  useToggleContentCommentLike,
} from '../../../hooks/useContentSocial.js'
import { CommentThread } from '../../social/CommentThread.js'
import type { ThreadComment } from '../../social/CommentThread.js'

interface ContentCommentsProps {
  profileId: string
  kind: 'photo' | 'media'
  targetId: string
  ownerUserId?: string
  onClose: () => void
}

export function ContentComments({ profileId, kind, targetId, ownerUserId, onClose }: ContentCommentsProps) {
  const { user, token } = useAuthStore()

  const { data: rawComments = [], isLoading } = useContentComments(profileId, kind, targetId, true)
  const postComment = usePostContentComment(profileId, kind, targetId)
  const deleteComment = useDeleteContentComment(profileId, kind, targetId)
  const editComment = useEditContentComment(profileId, kind, targetId)
  const likeComment = useToggleContentCommentLike(profileId, kind, targetId)

  const comments = rawComments as unknown as ThreadComment[]

  async function handlePost(text: string, parentId?: string) {
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
      variant="drawer"
      onClose={onClose}
    />
  )
}
