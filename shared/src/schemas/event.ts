import { z } from 'zod'

export const CreateEventSchema = z.object({
  title: z.string().min(2, 'Titulo muy corto').max(120),
  description: z.string().max(2000).optional(),
  date: z.string().datetime({ offset: true }),
  location: z.string().max(200).optional(),
  cover: z.string().url().optional(),
  media: z.array(z.string().url()).max(10).default([]),
})
export type CreateEventInput = z.infer<typeof CreateEventSchema>

export const UpdateEventSchema = CreateEventSchema.partial()
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export const EventResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  profileId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  location: z.string().optional(),
  cover: z.string().optional(),
  media: z.array(z.string()),
  isVisible: z.boolean(),
  likeCount: z.number().default(0),
  attendCount: z.number().default(0),
  commentCount: z.number().default(0),
  createdAt: z.string(),
  profile: z
    .object({
      id: z.string(),
      artistName: z.string(),
      avatar: z.string().optional(),
      type: z.string(),
      whatsapp: z.string().optional(),
    })
    .optional(),
})
export type EventResponse = z.infer<typeof EventResponseSchema>

export const CommentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  text: z.string(),
  createdAt: z.string(),
})
export type CommentResponse = z.infer<typeof CommentResponseSchema>

export const SocialStatsSchema = z.object({
  likeCount: z.number(),
  attendCount: z.number(),
  commentCount: z.number(),
  userLiked: z.boolean(),
  userAttending: z.boolean(),
})
export type SocialStats = z.infer<typeof SocialStatsSchema>
