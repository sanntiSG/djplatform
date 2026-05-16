import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  toggleLike,
  toggleAttend,
  getSocialStats,
  listComments,
  addComment,
  editComment,
  toggleCommentLike,
  deleteComment,
  getEventOwnerId,
} from '../services/socialService.js'
import { create as createNotification } from '../services/notificationService.js'

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getSocialStats(req.params.id, req.user?.id)
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

export async function like(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await toggleLike(req.params.id, req.user!.id)
    res.json(result)

    if (result.liked) {
      getEventOwnerId(req.params.id).then(ownerId => {
        if (ownerId && ownerId !== req.user!.id) {
          createNotification(ownerId, 'content_like', {
            actorId: req.user!.id,
            url: `/events/${req.params.id}`,
          }).catch(() => {})
        }
      })
    }
  } catch (err) {
    next(err)
  }
}

export async function attend(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await toggleAttend(req.params.id, req.user!.id)
    res.json(result)

    if (result.attending) {
      getEventOwnerId(req.params.id).then(ownerId => {
        if (ownerId && ownerId !== req.user!.id) {
          createNotification(ownerId, 'event_attend', {
            actorId: req.user!.id,
            url: `/events/${req.params.id}`,
          }).catch(() => {})
        }
      })
    }
  } catch (err) {
    next(err)
  }
}

function serializeComment(c: ReturnType<typeof Object.assign>, userId?: string) {
  return {
    id: (c._id ?? c.id)?.toString(),
    userId: c.userId?.toString(),
    userEmail: c.userEmail,
    text: c.text,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    editedAt: c.editedAt instanceof Date ? c.editedAt.toISOString() : c.editedAt,
    parentId: c.parentId?.toString() ?? null,
    likeCount: c.likeCount ?? 0,
    isLiked: c.isLiked ?? false,
    isOwn: userId ? c.userId?.toString() === userId : false,
    replies: (c.replies ?? []).map((r: typeof c) => serializeComment(r, userId)),
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await listComments(req.params.id, req.user?.id)
    res.json(comments.map((c) => serializeComment(c, req.user?.id)))
  } catch (err) {
    next(err)
  }
}

export async function postComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, parentId } = z
      .object({ text: z.string().min(1).max(500).trim(), parentId: z.string().optional() })
      .parse(req.body)
    const comment = await addComment(req.params.id, req.user!.id, text, parentId)
    res.status(201).json(serializeComment({ ...comment.toObject(), isLiked: false, isOwn: true, replies: [] }, req.user!.id))

    getEventOwnerId(req.params.id).then(ownerId => {
      if (ownerId && ownerId !== req.user!.id) {
        createNotification(ownerId, 'content_comment', {
          actorId: req.user!.id,
          payload: { text: text.slice(0, 80) },
          url: `/events/${req.params.id}`,
        }).catch(() => {})
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function patchComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await editComment(req.params.commentId, req.user!.id, text)
    res.json(serializeComment({ ...comment.toObject(), isLiked: false, isOwn: true, replies: [] }, req.user!.id))
  } catch (err) {
    next(err)
  }
}

export async function likeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await toggleCommentLike(req.params.commentId, req.user!.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function removeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const eventOwnerId = await getEventOwnerId(req.params.id)
    await deleteComment(req.params.commentId, req.user!.id, req.user!.role === 'admin', eventOwnerId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
