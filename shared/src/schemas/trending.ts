import { z } from 'zod'

export const TrendingEventSchema = z.object({
  kind: z.literal('event'),
  id: z.string(),
  slug: z.string(),
  profileId: z.string(),
  title: z.string(),
  cover: z.string().optional(),
  location: z.string().optional(),
  likeCount: z.number(),
})
export type TrendingEvent = z.infer<typeof TrendingEventSchema>

export const TrendingSongSchema = z.object({
  kind: z.literal('song'),
  mediaId: z.string(),
  profileId: z.string(),
  artistName: z.string(),
  title: z.string().optional(),
  platform: z.enum(['youtube', 'soundcloud', 'spotify']),
  thumbnailUrl: z.string().optional(),
  embedId: z.string().optional(),
  type: z.enum(['audio', 'video']),
  genres: z.array(z.string()).optional(),
  likeCount: z.number(),
})
export type TrendingSong = z.infer<typeof TrendingSongSchema>

export const TrendingItemSchema = z.discriminatedUnion('kind', [
  TrendingEventSchema,
  TrendingSongSchema,
])
export type TrendingItem = z.infer<typeof TrendingItemSchema>

export const TrendingResponseSchema = z.object({
  events: z.array(TrendingEventSchema),
  songs: z.array(TrendingSongSchema),
})
export type TrendingResponse = z.infer<typeof TrendingResponseSchema>
