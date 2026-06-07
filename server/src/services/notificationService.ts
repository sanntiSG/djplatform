import { NotificationType } from '../models/NotificationType.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import type { IUser } from '../models/User.js'
import { sendPush, type PushPayload } from './pushService.js'
import { logger } from '../utils/logger.js'
import { io } from '../realtime/io.js'

export interface CreateNotificationInput {
  actorId?: string
  payload?: Record<string, unknown>
  url?: string
}

const TYPE_LABELS: Record<string, { title: (actorName?: string) => string; body: (payload?: Record<string, unknown>) => string }> = {
  follow_new:       { title: (a) => `${a ?? 'Alguien'} te siguio`,          body: () => 'Tiene un nuevo seguidor en REsonar' },
  profile_like:     { title: (a) => `${a ?? 'Alguien'} le dio me gusta a tu perfil`, body: () => '' },
  profile_comment:  { title: (a) => `${a ?? 'Alguien'} comento en tu perfil`, body: (p) => String(p?.text ?? '') },
  content_like:     { title: (a) => `${a ?? 'Alguien'} reacciono a tu contenido`, body: () => '' },
  content_comment:  { title: (a) => `${a ?? 'Alguien'} comento en tu contenido`, body: (p) => String(p?.text ?? '') },
  media_like:       { title: (a) => `${a ?? 'Alguien'} reacciono a tu musica`, body: () => '' },
  event_new_followed_profile: { title: (a) => `${a ?? 'Un perfil que seguis'} publico un evento`, body: (p) => String(p?.title ?? '') },
  event_new_genre_match:      { title: () => 'Nuevo evento de tu genero', body: (p) => String(p?.title ?? '') },
  chat_message_new:           { title: (a) => `${a ?? 'Alguien'} te envio un mensaje`, body: (p) => String(p?.preview ?? '') },
  chat_message_reply:         { title: (a) => `${a ?? 'Alguien'} respondio tu mensaje`, body: (p) => String(p?.preview ?? '') },
  collab_request:                 { title: (a) => `${a ?? 'Alguien'} te propuso una colaboracion`, body: (p) => String(p?.title ?? '') },
  collab_confirmed:               { title: (a) => `${a ?? 'Alguien'} confirmo tu colaboracion`, body: (p) => String(p?.title ?? '') },
  event_attend:                   { title: (a) => `${a ?? 'Alguien'} confirmo asistencia a tu evento`, body: () => '' },
  opportunity_new_application:    { title: (a) => `${a ?? 'Alguien'} se postulo a tu oportunidad`, body: (p) => String(p?.title ?? '') },
  opportunity_closed:             { title: () => 'Oportunidad cerrada',   body: (p) => String(p?.title ?? '') },
  opportunity_application_accepted: { title: (a) => `${a ?? 'Alguien'} acepto tu postulacion`, body: (p) => String(p?.title ?? '') },
  opportunity_application_cancelled: { title: (a) => `${a ?? 'Alguien'} cancelo su postulacion`, body: (p) => String(p?.title ?? '') },
  opportunity_filled_other:       { title: () => 'Otro artista fue seleccionado', body: (p) => String(p?.title ?? '') },
  opportunity_cancelled:          { title: () => 'La oportunidad se cerro', body: (p) => String(p?.title ?? '') },
  project_new_application:        { title: (a) => `${a ?? 'Alguien'} quiere unirse a tu proyecto`, body: (p) => String(p?.title ?? '') },
  project_application_accepted:   { title: (a) => `${a ?? 'Alguien'} te acepto en el proyecto`, body: (p) => String(p?.title ?? '') },
  project_application_rejected:   { title: () => 'Solicitud rechazada', body: (p) => String(p?.title ?? '') },
  project_phase_changed:          { title: () => 'El proyecto cambio de fase', body: (p) => `${String(p?.title ?? '')} — ${String(p?.phase ?? '')}` },
  project_progress:               { title: (a) => `${a ?? 'El creador'} publico un avance`, body: (p) => String(p?.title ?? '') },
  project_completed:              { title: () => 'Proyecto finalizado', body: (p) => String(p?.title ?? '') },
}

export async function create(
  userId: string,
  typeKey: string,
  input: CreateNotificationInput = {},
): Promise<void> {
  try {
    const [type, user] = await Promise.all([
      NotificationType.findOne({ key: typeKey }).lean(),
      User.findById(userId),
    ])
    if (!type || !type.enabledByAdmin || !user) return
    if (!isTypeEnabledForUser(user, typeKey, type.category)) return

    // Fetch actor name if provided — populate acotado a artistName para no traer media[]/photos[]
    let actorName: string | undefined
    if (input.actorId) {
      const actor = await User.findById(input.actorId)
        .populate({ path: 'profileId', select: 'artistName' })
        .lean() as any
      actorName = actor?.profileId?.artistName
    }

    await Notification.create({
      userId,
      type: typeKey,
      actorId: input.actorId,
      payload: input.payload,
      url: input.url,
    })

    // Push to user's socket room so inbox and badge update instantly
    try {
      io.to(`user:${userId}`).emit('notification:new')
    } catch {
      // io may not be initialized in test environments — non-fatal
    }

    if (user.pushOptIn) {
      const template = TYPE_LABELS[typeKey]
      if (template) {
        const pushPayload: PushPayload = {
          title: template.title(actorName),
          body: template.body(input.payload),
          url: input.url ?? '/',
        }
        await sendPush(userId, pushPayload)
      }
    }
  } catch (err) {
    logger.warn('notificationService.create failed (non-fatal)', { userId, typeKey, err })
  }
}

export interface TypeWithUserState {
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
  enabledByAdmin: boolean
  userEnabled: boolean
}

export async function getTypesForUser(userId: string): Promise<TypeWithUserState[]> {
  const [types, user] = await Promise.all([
    NotificationType.find({ enabledByAdmin: true }).lean(),
    User.findById(userId),
  ])
  if (!user) return []

  return types.map(t => ({
    key: t.key,
    label: t.label,
    description: t.description,
    category: t.category,
    enabledByAdmin: t.enabledByAdmin,
    userEnabled: isTypeEnabledForUser(user, t.key, t.category),
  }))
}

export async function getUserPreferences(userId: string) {
  const user = await User.findById(userId)
  if (!user) return null
  return {
    pushOptIn: user.pushOptIn ?? false,
    notificationLevel: user.notificationLevel ?? 'profile',
    overrides: Object.fromEntries(user.notificationOverrides ?? new Map()),
  }
}

export async function updateUserPreferences(
  userId: string,
  data: {
    pushOptIn?: boolean
    notificationLevel?: 'profile' | 'all'
    overrides?: Record<string, boolean>
  },
) {
  const user = await User.findById(userId)
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })

  if (data.pushOptIn !== undefined) user.pushOptIn = data.pushOptIn
  if (data.notificationLevel !== undefined) user.notificationLevel = data.notificationLevel
  if (data.overrides) {
    for (const [key, val] of Object.entries(data.overrides)) {
      user.notificationOverrides.set(key, val)
    }
  }

  await user.save()
  return {
    pushOptIn: user.pushOptIn,
    notificationLevel: user.notificationLevel,
    overrides: Object.fromEntries(user.notificationOverrides),
  }
}

/** Marks all unread chat notifications for a conversation as read (called when user reads a conversation). */
export async function markChatNotificationsRead(userId: string, conversationId: string): Promise<void> {
  try {
    await Notification.updateMany(
      {
        userId,
        type: { $in: ['chat_message_new', 'chat_message_reply'] },
        'payload.conversationId': conversationId,
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    )
  } catch (err) {
    logger.warn('markChatNotificationsRead failed (non-fatal)', { userId, conversationId, err })
  }
}

/** Returns true if the user should receive this notification type. */
export function isTypeEnabledForUser(
  user: IUser,
  typeKey: string,
  category: 'profile' | 'all',
): boolean {
  // Check explicit override first
  const override = user.notificationOverrides?.get(typeKey)
  if (override !== undefined) return override

  // Category 'all' requires level 'all'
  if (category === 'all' && user.notificationLevel !== 'all') return false

  return true
}

/** Full check: admin + user combined. */
export async function isTypeEffectivelyEnabled(user: IUser, typeKey: string): Promise<boolean> {
  const type = await NotificationType.findOne({ key: typeKey }).lean()
  if (!type || !type.enabledByAdmin) return false
  return isTypeEnabledForUser(user, typeKey, type.category)
}
