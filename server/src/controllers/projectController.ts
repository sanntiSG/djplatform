import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Project } from '../models/Project.js'
import { ProjectMember } from '../models/ProjectMember.js'
import { ProjectProgressPost } from '../models/ProjectProgressPost.js'
import { ProjectConversation } from '../models/ProjectConversation.js'
import { ProjectMessage } from '../models/ProjectMessage.js'
import { Collaboration } from '../models/Collaboration.js'
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
    coverSvgKey: project.coverSvgKey,
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

/**
 * GET /projects/recommended — proyectos personalizados para el usuario.
 * Scoring multi-señal: roles (+3), géneros (+3), ubicación (+2), openToWork (+1), recencia (+1).
 * Devuelve cada proyecto con campo `matchReason` (texto legible).
 */
export async function recommended(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit ?? 6), 12)

    const userProfile = await Profile.findOne({ userId: req.user!.id })
      .select('roles genres location openToWork')
      .lean()

    if (!userProfile) {
      res.json([])
      return
    }

    const userRoles: string[]  = userProfile.roles ?? []
    const userGenres: string[] = userProfile.genres ?? []
    const userLocation: string = userProfile.location ?? ''
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Excluir propios y proyectos donde ya es miembro/postulado
    const myMemberships = await ProjectMember.find({ userId: req.user!.id }).select('projectId').lean()
    const excludedProjectIds = myMemberships.map((m) => m.projectId)

    const candidates = await Project.find({
      isVisible: true,
      status:    'open',
      userId:    { $ne: new mongoose.Types.ObjectId(req.user!.id) },
      _id:       { $nin: excludedProjectIds },
    }).lean()

    function normalizeLocation(loc?: string) {
      if (!loc) return ''
      return loc.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    }

    function locMatch(a: string, b: string) {
      if (!a || !b) return false
      const na = normalizeLocation(a); const nb = normalizeLocation(b)
      if (na === nb) return true
      const words = na.split(/[\s,]+/).filter((w) => w.length >= 3)
      return words.some((w) => nb.includes(w))
    }

    const scored = candidates
      .map((p: any) => {
        let score = 0
        const reasons: string[] = []

        const roleMatches = userRoles.filter((r) => (p.lookingForRoles ?? []).includes(r))
        if (roleMatches.length > 0) {
          score += roleMatches.length * 3
          reasons.push(`buscan ${roleMatches.slice(0, 2).join(', ')}`)
        }

        const genreMatches = userGenres.filter((g) => (p.genres ?? []).includes(g))
        if (genreMatches.length > 0) {
          score += genreMatches.length * 3
          if (!reasons.some((r) => r.includes('buscan'))) {
            reasons.push(`tu genero`)
          } else {
            reasons.push(`tu genero`)
          }
        }

        if (locMatch(userLocation, p.location ?? '')) {
          score += 2
          reasons.push(`tu ciudad`)
        }

        if (p.updatedAt && new Date(p.updatedAt) >= thirtyDaysAgo) {
          score += 1
        }

        return { ...p, score, matchReason: reasons.slice(0, 2).join(' · ') }
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const results = await Promise.all(
      scored.map(async (p) => {
        const { memberCount, pendingCount, isApplied, isMember } = await getMemberStats(
          p._id.toString(), req.user!.id,
        )
        return {
          ...serialize(p as any, memberCount, pendingCount, req.user!.id, isApplied, isMember),
          matchReason: p.matchReason as string,
        }
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

    // Detectar cambio de fase antes de aplicar el update
    const prevPhase = project.phase

    Object.assign(project, data)
    await project.save()

    // Si la fase cambio, notificar a todos los miembros activos
    if (data.phase && data.phase !== prevPhase) {
      const members = await ProjectMember.find({
        projectId:  project._id,
        status:     'member',
        isCreator:  false,
      }).lean()

      members.forEach((m) => {
        createNotification(m.userId.toString(), 'project_phase_changed', {
          actorId: req.user!.id,
          payload: { title: project.title, phase: data.phase },
          url: `/proyectos/${project._id}`,
        }).catch((err: unknown) => logger.error('phase change notif error', err))
      })
    }

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

    const projectId = project._id

    // Borrado en cascada completo: libera toda la memoria asociada
    // Primero obtener el ID del chat para borrar los mensajes
    const projectConv = await ProjectConversation.findOne({ projectId }).lean()

    await Promise.all([
      project.deleteOne(),
      ProjectMember.deleteMany({ projectId }),
      ProjectProgressPost.deleteMany({ projectId }),
      Collaboration.deleteMany({ projectId }),
      ProjectConversation.deleteMany({ projectId }),
      projectConv ? ProjectMessage.deleteMany({ conversationId: projectConv._id }) : Promise.resolve(),
    ])

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

/** Un miembro (no creador) abandona el proyecto desde su perfil */
export async function leaveProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() === req.user!.id) {
      res.status(400).json({ error: 'El creador no puede abandonar el proyecto. Usa eliminar en su lugar.' })
      return
    }

    const deleted = await ProjectMember.deleteOne({
      projectId: project._id,
      userId:    req.user!.id,
      isCreator: false,
    })

    if (deleted.deletedCount === 0) {
      res.status(404).json({ error: 'No sos miembro de este proyecto' })
      return
    }

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

    const { message: sentMessage, recipientId } = await sendMessage(convId, req.user!.id, messageBody, undefined, {
      type: 'project',
      projectId: project._id.toString(),
      title: project.title,
      cover: project.cover ?? undefined,
      applicantProfileId: applicantProfile._id.toString(),
    })

    io.to(`user:${req.user!.id}`).emit('message:new', { conversationId: convId, message: sentMessage })
    if (recipientId) {
      io.to(`user:${recipientId}`).emit('message:new', { conversationId: convId, message: sentMessage })
    }

    createNotification(project.userId.toString(), 'project_new_application', {
      actorId: req.user!.id,
      payload: { title: project.title },
      url: `/proyectos/${project._id}?focus=members`,
    }).catch((err: unknown) => logger.error('project notif error', err))

    // Evento socket dedicado para toast en vivo en el creador
    io.to(`user:${project.userId.toString()}`).emit('project:new_application', {
      projectId: project._id.toString(),
      title:     project.title,
    })

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

    // Notificar al nuevo miembro que fue aceptado
    createNotification(membership.userId.toString(), 'project_application_accepted', {
      actorId: req.user!.id,
      payload: { title: project.title },
      url: `/proyectos/${project._id}`,
    }).catch((err: unknown) => logger.error('project accept notif error', err))

    // Evento socket dedicado para toast en vivo en el aceptado
    io.to(`user:${membership.userId.toString()}`).emit('project:application_accepted', {
      projectId: project._id.toString(),
      title:     project.title,
    })

    // Notificar a los miembros existentes que hay un nuevo integrante
    const existingMembers = await ProjectMember.find({
      projectId:  project._id,
      status:     'member',
      userId:     { $nin: [membership.userId, new mongoose.Types.ObjectId(req.user!.id)] },
    }).lean()

    existingMembers.forEach((m) => {
      createNotification(m.userId.toString(), 'project_new_application', {
        actorId:  membership.userId.toString(),
        payload:  { title: `Nuevo miembro en ${project.title}` },
        url:      `/proyectos/${project._id}`,
      }).catch(() => { })
    })

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

    // Si el creador rechaza una postulacion pendiente, notificar al postulante
    if (isOwner && !isSelf && membership.status === 'pending') {
      createNotification(membership.userId.toString(), 'project_application_rejected', {
        actorId: req.user!.id,
        payload: { title: project.title },
        url: `/proyectos/${project._id}`,
      }).catch((err: unknown) => logger.error('project reject notif error', err))

      // Evento socket dedicado para toast en vivo en el rechazado
      io.to(`user:${membership.userId.toString()}`).emit('project:application_rejected', {
        projectId: project._id.toString(),
        title:     project.title,
      })
    }

    await membership.deleteOne()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

/** Lista los proyectos visibles de un perfil público (como miembro o creador) */
export async function getByProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = new mongoose.Types.ObjectId(parseObjectId(req.params.profileId))
    const memberships = await ProjectMember.find({
      profileId,
      status: 'member',
    }).lean()

    const projectIds = memberships.map((m) => m.projectId)
    const items = await Project.find({ _id: { $in: projectIds }, isVisible: true })
      .sort({ updatedAt: -1 })
      .limit(20)
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

/* ── Progress publishing ──────────────────────────────────── */

const PublishProgressSchema = z.object({
  svgKey:             z.string().min(1).max(30),
  message:            z.string().max(280).optional(),
  publishedToFeed:    z.boolean().default(false),
  publishedToProfile: z.boolean().default(false),
})

/** Crear un post de avance del proyecto (solo el creador) */
export async function publishProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = PublishProgressSchema.parse(req.body)
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'Solo el creador puede publicar avances' })
      return
    }

    const creatorProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!creatorProfile) {
      res.status(403).json({ error: 'Necesitas un perfil' })
      return
    }

    const FOUR_HOURS = 4 * 60 * 60 * 1000
    const post = await ProjectProgressPost.create({
      projectId:          project._id,
      creatorProfileId:   creatorProfile._id,
      creatorUserId:      req.user!.id,
      projectTitle:       project.title,
      artistName:         project.artistName,
      artistSlug:         project.artistSlug,
      phase:              project.phase,
      svgKey:             data.svgKey,
      message:            data.message,
      publishedToFeed:    data.publishedToFeed,
      publishedToProfile: data.publishedToProfile,
      memberShareEnabled: true,
      isCompletion:       false,
      expiresAt:          new Date(Date.now() + FOUR_HOURS),
    })

    // Si se publica en el feed global, registrar actividad
    if (data.publishedToFeed) {
      createActivity({
        type: 'project_progress',
        actorProfileId: creatorProfile._id.toString(),
        actorName:      project.artistName,
        actorAvatar:    project.avatar,
        targetTitle:    project.title,
        targetUrl:      `/proyectos/${project._id}`,
      }).catch(() => { })
    }

    // Si se publica en el perfil del creador, crear Collaboration de tipo 'project'
    if (data.publishedToProfile) {
      Collaboration.create({
        fromProfileId: creatorProfile._id,
        toProfileId:   creatorProfile._id,
        fromUserId:    req.user!.id,
        toUserId:      req.user!.id,
        title:         `${project.title} — Fase: ${project.phase}`,
        type:          'project',
        projectId:     project._id,
        confirmedByA:  true,
        confirmedByB:  true,
        confirmedAt:   new Date(),
      }).catch(() => { })
    }

    // Notificar a todos los miembros activos
    const members = await ProjectMember.find({
      projectId: project._id,
      status: 'member',
      isCreator: false,
    }).lean()

    members.forEach((m) => {
      createNotification(m.userId.toString(), 'project_progress', {
        actorId: req.user!.id,
        payload: { title: project.title },
        url: `/proyectos/${project._id}`,
      }).catch((err: unknown) => logger.error('progress notif error', err))
    })

    res.status(201).json({
      id: post._id.toString(),
      phase: post.phase,
      svgKey: post.svgKey,
      message: post.message,
      publishedToFeed: post.publishedToFeed,
      publishedToProfile: post.publishedToProfile,
      expiresAt: post.expiresAt?.toISOString(),
      memberShareEnabled: post.memberShareEnabled,
    })
  } catch (err) {
    next(err)
  }
}

/** Eliminar un post de avance (solo el creador) */
export async function deleteProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await ProjectProgressPost.findById(parseObjectId(req.params.postId))
    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' })
      return
    }
    if (post.creatorUserId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'Solo el creador puede eliminar el avance' })
      return
    }
    await post.deleteOne()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

/** Un miembro comparte el avance en su propio perfil (aparece en Collabs) */
export async function memberShareProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await ProjectProgressPost.findById(parseObjectId(req.params.postId))
    if (!post || !post.memberShareEnabled) {
      res.status(404).json({ error: 'El post de avance no esta disponible' })
      return
    }

    const memberProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!memberProfile) {
      res.status(403).json({ error: 'Necesitas un perfil' })
      return
    }

    // Verificar que sea miembro del proyecto
    const membership = await ProjectMember.findOne({
      projectId: post.projectId,
      userId:    req.user!.id,
      status:    'member',
    })
    if (!membership) {
      res.status(403).json({ error: 'Solo los miembros pueden compartir el avance' })
      return
    }

    // Verificar que no haya compartido ya
    if (post.memberSharedBy.some((id) => id.toString() === memberProfile._id.toString())) {
      res.status(400).json({ error: 'Ya compartiste este avance' })
      return
    }

    // Crear Collaboration de tipo 'project' para el miembro
    await Collaboration.create({
      fromProfileId: memberProfile._id,
      toProfileId:   post.creatorProfileId,
      fromUserId:    req.user!.id,
      toUserId:      post.creatorUserId,
      title:         `${post.projectTitle} — Fase: ${post.phase}`,
      type:          'project',
      projectId:     post.projectId,
      confirmedByA:  true,
      confirmedByB:  true,
      confirmedAt:   new Date(),
    })

    // Registrar en el post
    post.memberSharedBy.push(memberProfile._id as any)
    await post.save()

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

/** Feed de avances activos para la sección MainFeed "Proyectos en marcha".
 *  Incluye posts regulares (no expirados) Y posts de finalización (permanentes). */
export async function getProgressFeed(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date()
    const posts = await ProjectProgressPost.find({
      publishedToFeed: true,
      $or: [
        { isCompletion: false, expiresAt: { $gt: now } },
        { isCompletion: true },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    res.json(posts.map((p) => ({
      id:           p._id.toString(),
      projectId:    p.projectId.toString(),
      projectTitle: p.projectTitle,
      artistName:   p.artistName,
      artistSlug:   p.artistSlug,
      phase:        p.phase,
      svgKey:       p.svgKey,
      message:      p.message,
      isCompletion: p.isCompletion,
      expiresAt:    p.expiresAt?.toISOString(),
      createdAt:    p.createdAt.toISOString(),
    })))
  } catch (err) {
    next(err)
  }
}

/** Finalizar el proyecto — flujo de completion */
export async function completeProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(parseObjectId(req.params.id))
    if (!project || !project.isVisible) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }
    if (project.userId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'Solo el creador puede finalizar el proyecto' })
      return
    }

    // Marcar como finalizado
    project.phase  = 'released'
    project.status = 'closed'
    await project.save()

    const creatorProfile = await Profile.findOne({ userId: req.user!.id }).lean()

    // Crear post de completion (sin expiración, aparece en feed)
    const completionPost = await ProjectProgressPost.create({
      projectId:          project._id,
      creatorProfileId:   creatorProfile?._id ?? project.profileId,
      creatorUserId:      req.user!.id,
      projectTitle:       project.title,
      artistName:         project.artistName,
      artistSlug:         project.artistSlug,
      phase:              'released',
      svgKey:             'star',
      message:            undefined,
      publishedToFeed:    true,
      publishedToProfile: false,
      memberShareEnabled: true,
      isCompletion:       true,
      expiresAt:          undefined,
    })

    // Registrar actividad de finalización
    createActivity({
      type: 'project_completed',
      actorProfileId: (creatorProfile?._id ?? project.profileId).toString(),
      actorName:      project.artistName,
      actorAvatar:    project.avatar,
      targetTitle:    project.title,
      targetUrl:      `/proyectos/${project._id}`,
    }).catch(() => { })

    // Crear Collaboration tipo 'project' para cada miembro activo
    const members = await ProjectMember.find({
      projectId: project._id,
      status:    'member',
    }).lean()

    for (const m of members) {
      if (m.isCreator) continue
      Collaboration.create({
        fromProfileId: project.profileId,
        toProfileId:   m.profileId,
        fromUserId:    project.userId,
        toUserId:      m.userId,
        title:         project.title,
        type:          'project',
        projectId:     project._id,
        confirmedByA:  true,
        confirmedByB:  true,
        confirmedAt:   new Date(),
      }).catch(() => { })

      createNotification(m.userId.toString(), 'project_completed', {
        actorId: req.user!.id,
        payload: { title: project.title },
        url: `/proyectos/${project._id}`,
      }).catch((err: unknown) => logger.error('completion notif error', err))
    }

    res.json({ id: completionPost._id.toString(), ok: true })
  } catch (err) {
    next(err)
  }
}
