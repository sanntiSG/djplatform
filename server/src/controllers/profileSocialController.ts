import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { parseObjectId } from '../utils/parseId.js'
import * as service from '../services/profileSocialService.js'

function extractProfileId(param: string): string | null {
  const id = parseObjectId(param)
  return id.length === 24 ? id : null
}

export async function getProfileSocial(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const stats = await service.getProfileSocialStats(profileId, req.user?.id)
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

export async function follow(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const result = await service.toggleFollow(req.user!.id, profileId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function likeProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const result = await service.toggleLike(req.user!.id, profileId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getProfileComments(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const comments = await service.getComments(profileId)
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

export async function postProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await service.addComment(
      req.user!.id,
      profileId,
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

export async function deleteProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { commentId } = req.params
    await service.deleteComment(req.user!.id, commentId, req.user!.role === 'admin')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
