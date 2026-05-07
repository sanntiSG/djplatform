import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as service from '../services/contentSocialService.js'

const TargetKindSchema = z.enum(['photo', 'media'])

function parseId(param: string): string | null {
  return /^[0-9a-fA-F]{24}$/.test(param) ? param : null
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

    const comments = await service.getContentComments(profileId, kindResult.data, targetId)
    res.json(
      comments.map((c) => ({
        id: c._id.toString(),
        userEmail: c.userEmail,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        isOwn: req.user?.id === c.userId.toString(),
      })),
    )
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

    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await service.addContentComment(
      req.user!.id,
      profileId,
      kindResult.data,
      targetId,
      req.user!.email,
      text,
    )

    res.status(201).json({
      id: comment._id.toString(),
      userEmail: comment.userEmail,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      isOwn: true,
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { commentId } = req.params
    await service.deleteContentComment(req.user!.id, commentId, req.user!.role === 'admin')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
