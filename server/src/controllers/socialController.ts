import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  toggleLike,
  toggleAttend,
  getSocialStats,
  listComments,
  addComment,
  deleteComment,
} from '../services/socialService.js'

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
  } catch (err) {
    next(err)
  }
}

export async function attend(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await toggleAttend(req.params.id, req.user!.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await listComments(req.params.id)
    res.json(
      comments.map((c) => ({
        id: c._id.toString(),
        userId: c.userId.toString(),
        userEmail: c.userEmail,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
    )
  } catch (err) {
    next(err)
  }
}

export async function postComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await addComment(req.params.id, req.user!.id, text)
    res.status(201).json({
      id: comment._id.toString(),
      userId: comment.userId.toString(),
      userEmail: comment.userEmail,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    })
  } catch (err) {
    next(err)
  }
}

export async function removeComment(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteComment(req.params.commentId, req.user!.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
