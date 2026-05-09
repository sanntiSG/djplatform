import { useAuthStore } from '../../store/useAuthStore.js'
import {
  useComments,
  usePostComment,
  useDeleteComment,
  useEditComment,
  useToggleCommentLike,
} from '../../hooks/useSocial.js'
import { CommentThread } from '../social/CommentThread.js'
import type { ThreadComment } from '../social/CommentThread.js'

interface EventCommentsProps {
  eventId: string
  ownerUserId?: string
  anchorRef?: React.RefObject<HTMLDivElement>
}

export function EventComments({ eventId, ownerUserId, anchorRef }: EventCommentsProps) {
  const { user, token } = useAuthStore()
  const { data: rawComments = [], isLoading } = useComments(eventId)
  const postComment = usePostComment(eventId)
  const deleteComment = useDeleteComment(eventId)
  const editComment = useEditComment(eventId)
  const likeComment = useToggleCommentLike(eventId)

  const comments = rawComments as unknown as ThreadComment[]

  async function handlePost(text: string, parentId?: string) {
    await postComment.mutateAsync(text)
  }

  async function handleEdit(commentId: string, text: string) {
    await editComment.mutateAsync({ commentId, text })
  }

  return (
    <div ref={anchorRef}>
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
    </div>
  )
}
