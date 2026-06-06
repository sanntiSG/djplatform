import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Project } from '../models/Project.js'
import { ProjectMember } from '../models/ProjectMember.js'
import { Profile } from '../models/Profile.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'
import { findOrCreateConversation, sendMessage } from '../services/conversationService.js'
import { create as createNotification } from '../services/notificationService.js'
import { io } from '../realtime/io.js'
import { logger } from '../utils/logger.js'
import { CreateProjectSchema, UpdateProjectSchema, ApplyProjectSchema } from '@dj/shared'

/* ── Serializer ───────────────────────────────────────────── */

interface MemberView {
  id: string
  profileId: string
  userId: string
  artistName: string
  avatar?: string
  slug: string
  role: string
  status: 'pending' | 'member' | 'rejected'
  isCreator: boolean
  joinedAt?: string
}

function serialize(
  project: InstanceType<typeof Project>,
  memberCount: number,
  pendingCount: number,
  requestUserId?: string,
  isApplied = false,
  isMember = false,
  members?: MemberView[],
) {
  return {
    id: project._id.toString(),
    profileId: project.profileId.toString(),
    userId: project.userId.toString(),
    artistName: project.artistName,
    avatar: project.avatar,
    artistSlug: project.artistSlug,
    title: project.title,
    description: project.description,
    cover: project.cover,
    genres: project.genres,
    location: project.location,
    lookingForRoles: project.lookingForRoles,
    phase: project.phase,
    status: project.status,
    memberCount,
    pendingCount,
    isApplied,
    isMember,
    members,
    createdAt: project.createdAt.toISOString(),
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

async function getMemberStats(projectId: string, requestUserId?: string) {
  const [allMembers, userMembership] = await Promise.all([
    ProjectMember.find({ projectId, status: { $in: ['member', 'pending'] } })
      .select('status isCreator')
      .lean(),
    requestUserId
      ? ProjectMember.findOne({ projectId, userId: requestUserId }).select('status').lean()
      : Promise.resolve(null),
  ])

  const memberCount  = allMembers.filter((m) => m.status === 'member').length
  const pendingCount = allMembers.filter((m) => m.status === 'pending').length
  const isApplied    = userMembership?.status === 'pending'
  const isMember     = userMembership?.status === 'member'

  return { memberCount, pendingCount, isApplied, isMember }
}

/* ── Public endpoints ─────────────────────────────────────── */

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { phase, role, genre, status = 'open', limit = '20', cursor } = req.query as Record<string, string>

    const query: Record<string, unknown> = { isVisible: true, status }
    if (phase) query.phase = phase
    if (role) query.lookingForRoles = role
    if (genre) query.genres = genre
    if (cursor) query._id = { $lt: cursor }

    const items = await Project.find(query)
      .sort({ _id: -1 })
      .limit(Math.min(Number(limit), 50))
      .lean()

    const results = await Promise.all(
      items.map(async (p) => {
        const { memberCount, pendingCount, isApplied, isMember } = await getMemberStats(
          p._id.toString(), req.user?.id,
        )
        return serialize(p as any, memberCount, pendingCount, req.user?.id, isApplied, isMember)
      }),
    )

    res.json(results)
  } catch (err) {
    next(err)
  }
}

export async function forMe(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit ?? 6), 20)
    const userProfile = await Profile.findOne({ userId: req.user!.id }).select('roles genres').lean()
    const userRoles: string[] = userProfile?.roles ?? []

    if (userRoles.length === 0) {
      res.json([])
      return
    }

    const items = await Project.aggregate([
      {
        $match: {
          isVisible: true,
          status: 'open',
          userId: { $ne: new mongoose.Types.ObjectId(req.user!.id) },
        },
      },
      {
        $addFields: {
          matchScore: {
            $size: { $setIntersection: ['$lookingForRoles', userRoles] },
          },
        },
      },
      { $match: { matchScore: { $gte: 1 } } },
      { $sort: { matchScore: -1, createdAt: -1 } },
      { $limit: limit },
    ])

    const results = await Promise.all(
      items.map(async (p: any) => {
        const { memberCount, pendingCount, isApplied, isMember } = await getMemberStats(
          p._id.toString(), req.user!.id,
        )
        return serialize(p, memberCount, pendingCount, req.user!.id, isApplied, isMember)
      }),
    )

    res.json(results)
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }

    const { memberCount, pendingCount, isApplied, isMember } = await getMemberStats(
      project._id.toString(), req.user?.id,
    )

    const isOwner = req.user && project.userId.toString() === req.user.id
    let members: MemberView[] | undefined

    if (isOwner) {
      // Mostrar todos los miembros (activos + pendientes) al creador
      const memberDocs = await ProjectMember.find({
        projectId: project._id,
        status: { $in: ['member', 'pending'] },
      }).lean()

      const profileIds = memberDocs.map((m) => m.profileId)
      const profiles = await Profile.find({ _id: { $in: profileIds } })
        .select('artistName avatar userId')
        .lean()

      const profileMap = new Map(profiles.map((p) => [p._id.toString(), p]))

      members = memberDocs.map((m): MemberView => {
        const p = profileMap.get(m.profileId.toString())
        return {
          id:         m._id.toString(),
          profileId:  m.profileId.toString(),
          userId:     m.userId.toString(),
          artistName: p?.artistName ?? 'Artista',
          avatar:     p?.avatar,
          slug:       (p?.artistName ?? '').toLowerCase().replace(/\s+/g, '-'),
          role:       m.role,
          status:     m.status,
          isCreator:  m.isCreator,
          joinedAt:   m.joinedAt?.toISOString(),
        }
      })
    } else if (isMember) {
      // Mostrar solo miembros activos al resto de miembros
      const memberDocs = await ProjectMember.find({
        projectId: project._id,
        status: 'member',
      }).lean()
      const profileIds = memberDocs.map((m) => m.profileId)
      const profiles = await Profile.find({ _id: { $in: profileIds } })
        .select('artistName avatar userId')
        .lean()
      const profileMap = new Map(profiles.map((p) => [p._id.toString(), p]))
      members = memberDocs.map((m): MemberView => {
        const p = profileMap.get(m.profileId.toString())
        return {
          id:         m._id.toString(),
          profileId:  m.profileId.toString(),
          userId:     m.userId.toString(),
          artistName: p?.artistName ?? 'Artista',
          avatar:     p?.avatar,
          slug:       (p?.artistName ?? '').toLowerCase().replace(/\s+/g, '-'),
          role:       m.role,
          status:     'member',
          isCreator:  m.isCreator,
          joinedAt:   m.joinedAt?.toISOString(),
        }
      })
    }

    res.json(serialize(project, memberCount, pendingCount, req.user?.id, isApplied, isMember, members))
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateProjectSchema.parse(req.body)
    const profile = await Profile.findOne({ userId: req.user!.id })
    if (!profile) {
      res.status(403).json({ error: 'Necesitas un perfil para crear proyectos' })
      return
    }

    if (req.user!.role !== 'admin') {
      const activeCount = await Project.countDocuments({ userId: req.user!.id, status: 'open', isVisible: true })
      if (activeCount >= 3) {
        res.status(429).json({ error: 'Tenes 3 proyectos activos. Cerra o elimina alguno para crear otro.' })
        return
      }
    }

    const artistSlug = profile.artistName.toLowerCase().replace(/\s+/g, '-')

    const project = await Project.create({
      ...data,
      profileId:  profile._id,
      userId:     req.user!.id,
      artistName: profile.artistName,
      avatar:     profile.avatar,
      artistSlug,
    })

    // El creador es el primer miembro
    await ProjectMember.create({
      projectId: project._id,
      profileId: profile._id,
      userId:    req.user!.id,
      role:      'Creador',
      status:    'member',
      isCreator: true,
      joinedAt:  new Date(),
    })

    createActivity({
      type: 'project_created',
      actorProfileId: profile._id.toString(),
      actorName:      profile.artistName,
      actorAvatar:    profile.avatar,
      targetTitle:    project.title,
      targetUrl:      `/proyectos/${project._id}`,
    }).catch(() => { })

    res.status(201).json(serialize(project, 1, 0, req.user!.id, false, true))
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateProjectSchema.parse(req.body)
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Solo el creador puede editar el proyecto' })
      return
    }

    Object.assign(project, data)
    await project.save()

    const { memberCount, pendingCount } = await getMemberStats(project._id.toString())
    res.json(serialize(project, memberCount, pendingCount, req.user!.id, false, true))
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Solo el creador puede eliminar el proyecto' })
      return
    }

    project.isVisible = false
    await project.save()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

/* ── Membership endpoints ─────────────────────────────────── */

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, message: customMessage } = ApplyProjectSchema.parse(req.body)
    const project = await Project.findById(parseObjectId(req.params.id))

    if (!project || !project.isVisible || project.status !== 'open') {
      res.status(404).json({ error: 'Proyecto no disponible' })
      return
    }
    if (project.userId.toString() === req.user!.id) {
      res.status(400).json({ error: 'No podes postularte a tu propio proyecto' })
      return
    }

    const applicantProfile = await Profile.findOne({ userId: req.user!.id })
    if (!applicantProfile) {
      res.status(403).json({ error: 'Necesitas un perfil para unirte a proyectos' })
      return
    }

    const existing = await ProjectMember.findOne({
      projectId: project._id,
      userId: req.user!.id,
    })
    if (existing) {
      res.status(400).json({ error: 'Ya sos miembro o ya te postulaste' })
      return
    }

    await ProjectMember.create({
      projectId: project._id,
      profileId: applicantProfile._id,
      userId:    req.user!.id,
      role:      role ?? '',
      status:    'pending',
      isCreator: false,
    })

    // Abrir/continuar conversacion con el creador + enviar mensaje
    const conv = await findOrCreateConversation(req.user!.id, project.userId.toString())
    const convId = (conv._id as any).toString()
    const messageBody = customMessage?.trim()
      || `Hola ${project.artistName}, vi tu proyecto "${project.title}" en REsonar y me gustaria sumarme. Cuales son los proximos pasos?`

    // Note: no attachment (IMessageAttachment is typed for opportunities only; project messages are plain)
    const { message: sentMessage, recipientId } = await sendMessage(convId, req.user!.id, messageBody)

    io.to(`user:${req.user!.id}`).emit('message:new', { conversationId: convId, message: sentMessage })
    if (recipientId) {
      io.to(`user:${recipientId}`).emit('message:new', { conversationId: convId, message: sentMessage })
    }

    createNotification(project.userId.toString(), 'project_new_application', {
      actorId: req.user!.id,
      payload: { title: project.title },
      url: `/proyectos/${project._id}?focus=members`,
    }).catch((err: unknown) => logger.error('project notif error', err))

    res.json({ conversationId: convId })
  } catch (err) {
    next(err)
  }
}

export async function cancelApply(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }

    await ProjectMember.deleteOne({
      projectId: project._id,
      userId:    req.user!.id,
      status:    'pending',
    })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function acceptMember(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'Solo el creador puede aceptar miembros' })
      return
    }

    const membership = await ProjectMember.findById(parseObjectId(req.params.memberId))
    if (!membership || membership.projectId.toString() !== project._id.toString()) {
      res.status(404).json({ error: 'Solicitud no encontrada' })
      return
    }
    if (membership.status !== 'pending') {
      res.status(400).json({ error: 'La solicitud ya fue procesada' })
      return
    }

    membership.status   = 'member'
    membership.joinedAt = new Date()
    await membership.save()

    createNotification(membership.userId.toString(), 'project_application_accepted', {
      actorId: req.user!.id,
      payload: { title: project.title },
      url: `/proyectos/${project._id}`,
    }).catch((err: unknown) => logger.error('project accept notif error', err))

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }

    const membership = await ProjectMember.findById(parseObjectId(req.params.memberId))
    if (!membership || membership.projectId.toString() !== project._id.toString()) {
      res.status(404).json({ error: 'Miembro no encontrado' })
      return
    }

    const isOwner       = project.userId.toString() === req.user!.id
    const isSelf        = membership.userId.toString() === req.user!.id
    const isCreatorSlot = membership.isCreator

    if (!isOwner && !isSelf) {
      res.status(403).json({ error: 'Sin permisos para esta accion' })
      return
    }
    if (isCreatorSlot) {
      res.status(400).json({ error: 'El creador no puede abandonar su propio proyecto' })
      return
    }

    await membership.deleteOne()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function myProjects(req: Request, res: Response, next: NextFunction) {
  try {
    // Proyectos donde el usuario es miembro o creador
    const memberships = await ProjectMember.find({
      userId: req.user!.id,
      status: 'member',
    }).lean()

    const projectIds = memberships.map((m) => m.projectId)
    const items = await Project.find({ _id: { $in: projectIds }, isVisible: true })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()

    const results = await Promise.all(
      items.map(async (p) => {
        const { memberCount, pendingCount, isApplied, isMember } = await getMemberStats(
          p._id.toString(), req.user!.id,
        )
        return serialize(p as any, memberCount, pendingCount, req.user!.id, isApplied, isMember)
      }),
    )

    res.json(results)
  } catch (err) {
    next(err)
  }
}
