import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { parseObjectId } from '../utils/parseId.js'
import * as service from '../services/profileSocialService.js'
import { Profile } from '../models/Profile.js'
import { create as createNotification } from '../services/notificationService.js'
import { createActivity } from '../services/activityService.js'

async function getProfileOwner(profileId: string): Promise<string | null> {
  const profile = await Profile.findById(profileId, { userId: 1 }).lean()
  return profile?.userId?.toString() ?? null
}

function extractProfileId(param: string): string | null {
  const id = parseObjectId(param)
  return id.length === 24 ? id : null
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

    if (result.followed) {
      Promise.all([
        getProfileOwner(profileId),
        Profile.findOne({ userId: req.user!.id }, { artistName: 1, avatar: 1, _id: 1 }).lean(),
        Profile.findById(profileId, { artistName: 1 }).lean(),
      ]).then(([ownerId, actorProfile, targetProfile]) => {
        if (ownerId && ownerId !== req.user!.id) {
          createNotification(ownerId, 'follow_new', {
            actorId: req.user!.id,
            url: `/p/${profileId}`
          }).catch(() => {})
        }
        if (actorProfile) {
          createActivity({
            type: 'profile_followed',
            actorProfileId: actorProfile._id.toString(),
            actorName: actorProfile.artistName,
            actorAvatar: actorProfile.avatar,
            targetTitle: targetProfile?.artistName,
            targetUrl: `/p/${profileId}`,
          }).catch(() => {})
        }
      }).catch(() => {})
    }
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

    if (result.liked) {
      getProfileOwner(profileId).then(ownerId => {
        if (ownerId && ownerId !== req.user!.id) {
          createNotification(ownerId, 'profile_like', { actorId: req.user!.id, url: `/p/${profileId}` }).catch(() => {})
        }
      })
    }
  } catch (err) {
    next(err)
  }
}

export async function getProfileComments(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const comments = await service.getComments(profileId, req.user?.id)
    res.json(comments.map((c) => serializeComment(c as unknown as Record<string, unknown>, req.user?.id)))
  } catch (err) {
    next(err)
  }
}

export async function postProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const { text, parentId } = z
      .object({ text: z.string().min(1).max(500).trim(), parentId: z.string().optional() })
      .parse(req.body)

    const comment = await service.addComment(
      req.user!.id,
      profileId,
      req.user!.email,
      text,
      parentId,
    )

    res.status(201).json(serializeComment(
      { ...comment.toObject?.() ?? comment, isLiked: false, isOwn: true, replies: [] } as Record<string, unknown>,
      req.user!.id,
    ))

    getProfileOwner(profileId).then(ownerId => {
      if (ownerId && ownerId !== req.user!.id) {
        createNotification(ownerId, 'profile_comment', {
          actorId: req.user!.id,
          payload: { text: text.slice(0, 80) },
          url: `/p/${profileId}`,
        }).catch(() => {})
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function patchProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { commentId } = req.params
    const { text } = z.object({ text: z.string().min(1).max(500).trim() }).parse(req.body)
    const comment = await service.editComment(commentId, req.user!.id, text)
    res.json(serializeComment(
      { ...comment.toObject?.() ?? comment, isLiked: false, isOwn: true, replies: [] } as Record<string, unknown>,
      req.user!.id,
    ))
  } catch (err) {
    next(err)
  }
}

export async function likeProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.toggleCommentLike(req.params.commentId, req.user!.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function deleteProfileComment(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = extractProfileId(req.params.id)
    if (!profileId) return res.status(400).json({ message: 'ID invalido' })

    const profileOwnerId = await service.getProfileOwnerId(profileId)
    await service.deleteComment(req.user!.id, req.params.commentId, req.user!.role === 'admin', profileOwnerId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
