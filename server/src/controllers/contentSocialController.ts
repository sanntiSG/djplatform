import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as service from '../services/contentSocialService.js'

const TargetKindSchema = z.enum(['photo', 'media'])

function parseId(param: string): string | null {
  return /^[0-9a-fA-F]{24}$/.test(param) ? param : null
}

function serializeComment(c: Record<string, unknown>, userId?: string): Record<string, unknown> {
  return {
    id: String(c._id ?? c.id ?? ''),
    userId: String(c.userId ?? ''),
    userEmail: String(c.userEmail ?? ''),
    text: String(c.text ?? ''),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt ?? ''),
    editedAt: c.editedAt instanceof Date ? (c.editedAt as Date).toISOString() : (c.editedAt ?? null),
    parentId: c.parentId ? String(c.parentId) : null,
    likeCount: Number(c.likeCount ?? 0),
    isLiked: Boolean(c.isLiked ?? false),
    isOwn: userId ? String(c.userId ?? '') === userId : false,
    replies: Array.isArray(c.replies)
      ? (c.replies as Record<string, unknown>[]).map((r) => serializeComment(r, userId))
      : [],
  }
}

export async function getContentSocial(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseId(req.params.profileId)
    if (!profileId) { res.status(400).json({ message: 'ID invalido' }); return }

    const map = await service.getProfileContentSocial(profileId, req.user?.id)
    res.json(map)
  } catch (err) {
    next(err)
  }
}

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseId(req.params.profileId)
    const targetId = parseId(req.params.targetId)
    const kindResult = TargetKindSchema.safeParse(req.params.kind)

    if (!profileId || !targetId || !kindResult.success) {
      res.status(400).json({ message: 'Parametros invalidos' }); return
    }

    const result = await service.toggleContentLike(
      req.user!.id,
      profileId,
      kindResult.data,
      targetId,
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseId(req.params.profileId)
    const targetId = parseId(req.params.targetId)
    const kindResult = TargetKindSchema.safeParse(req.params.kind)

    if (!profileId || !targetId || !kindResult.success) {
      res.status(400).json({ message: 'Parametros invalidos' }); return
    }

    const comments = await service.getContentComments(profileId, kindResult.data, targetId, req.user?.id)
    res.json(comments.map((c) => serializeComment(c as unknown as Record<string, unknown>, req.user?.id)))
  } catch (err) {
    next(err)
  }
}

export async function postComment(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseId(req.params.profileId)
    const targetId = parseId(req.params.targetId)
    const kindResult = TargetKindSchema.safeParse(req.params.kind)

    if (!profileId || !targetId || !kindResult.success) {
      res.status(400).json({ message: 'Parametros invalidos' }); return
    }

    const { text, parentId } = z
      .object({ text: z.string().min(1).max(500).trim(), parentId: z.string().optional() })
      .parse(req.body)

    const comment = await service.addContentComment(
      req.user!.id,
      profileId,
      kindResult.data,
      targetId,
      req.user!.email,
      text,
      parentId,
    )

    res.status(201).json(serializeComment(
      { ...comment.toObject?.() ?? comment, isLiked: false, isOwn: true, replies: [] } as Record<string, unknown>,
      req.user!.id,
    ))
  } catch (err) {
    next(err)
  }
}

export async function patchComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { commentId } = req.params
    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await service.editContentComment(commentId, req.user!.id, text)
    res.json(serializeComment(
      { ...comment.toObject?.() ?? comment, isLiked: false, isOwn: true, replies: [] } as Record<string, unknown>,
      req.user!.id,
    ))
  } catch (err) {
    next(err)
  }
}

export async function likeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.toggleContentCommentLike(req.params.commentId, req.user!.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, commentId } = req.params
    const pid = parseId(profileId)
    if (!pid) { res.status(400).json({ message: 'ID invalido' }); return }

    const profileOwnerId = await service.getProfileOwnerId(pid)
    await service.deleteContentComment(req.user!.id, commentId, req.user!.role === 'admin', profileOwnerId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
