import { z } from 'zod'

export const MediaPlatformSchema = z.enum(['youtube', 'soundcloud', 'spotify'])
export type MediaPlatform = z.infer<typeof MediaPlatformSchema>

export const MediaTypeSchema = z.enum(['audio', 'video'])

export const MediaItemSchema = z.object({
  id: z.string().optional(),
  platform: MediaPlatformSchema,
  url: z.string().url(),
  embedId: z.string().optional(),
  embedHtml: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  type: MediaTypeSchema,
  title: z.string().optional(),
  description: z.string().max(1000).optional().default(''),
  genres: z.array(z.string()).max(3).optional().default([]),
  addedAt: z.string().datetime().optional(),
})
export type MediaItem = z.infer<typeof MediaItemSchema>

export const MediaResolveInputSchema = z.object({
  url: z.string().url('URL invalida'),
})
export type MediaResolveInput = z.infer<typeof MediaResolveInputSchema>

export const MediaResolveOutputSchema = MediaItemSchema.omit({ id: true, addedAt: true })
export type MediaResolveOutput = z.infer<typeof MediaResolveOutputSchema>
