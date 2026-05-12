import { z } from 'zod'
import { MediaItemSchema } from './media.js'

export const PhotoSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  caption: z.string().max(500).optional(),
  addedAt: z.string().datetime(),
})
export type Photo = z.infer<typeof PhotoSchema>

// Open string — validated at runtime against the ProfileType catalog
export const ProfileTypeSchema = z.string().min(2).max(40)
export type ProfileType = string

export const AvailabilitySchema = z.enum(['available', 'contact', 'unavailable'])
export type Availability = z.infer<typeof AvailabilitySchema>

export const CreateProfileSchema = z.object({
  type: ProfileTypeSchema,
  artistName: z.string().min(2, 'Nombre artistico muy corto').max(60),
  bio: z.string().max(1000, 'Bio demasiado larga').optional(),
  location: z.string().max(100).optional(),
  locationVerified: z.boolean().optional(),
  genres: z.array(z.string()).max(10).default([]),
  eventTypes: z.array(z.string()).max(10).default([]),
  availability: AvailabilitySchema.default('contact'),
  whatsapp: z.string().optional(),
  priceRange: z.string().optional(),
})
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>

export const ProfileThemeSchema = z.enum(['minimal', 'neon', 'cosmic', 'fire', 'void'])
export type ProfileTheme = z.infer<typeof ProfileThemeSchema>

export const UpdateProfileSchema = CreateProfileSchema.partial().extend({
  avatar: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  theme: ProfileThemeSchema.optional(),
  accentColor: z.string().max(20).optional(),
  locationVerified: z.boolean().optional(),
  media: z.array(MediaItemSchema).max(20).optional(),
  photos: z.array(PhotoSchema).max(30).optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export const ProfileResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  userId: z.string(),
  type: ProfileTypeSchema,
  artistName: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  coverImage: z.string().optional(),
  theme: ProfileThemeSchema.optional(),
  accentColor: z.string().optional(),
  location: z.string().optional(),
  locationVerified: z.boolean().optional(),
  genres: z.array(z.string()),
  eventTypes: z.array(z.string()),
  availability: AvailabilitySchema,
  whatsapp: z.string().optional(),
  media: z.array(MediaItemSchema),
  photos: z.array(PhotoSchema).default([]),
  priceRange: z.string().optional(),
  isVisible: z.boolean(),
  createdAt: z.string(),
})
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>

export const ProfileSocialSchema = z.object({
  followerCount: z.number(),
  likeCount: z.number(),
  commentCount: z.number(),
  isFollowing: z.boolean(),
  isLiked: z.boolean(),
})
export type ProfileSocial = z.infer<typeof ProfileSocialSchema>

const BaseProfileCommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  text: z.string(),
  createdAt: z.string(),
  isOwn: z.boolean(),
  parentId: z.string().nullable().optional(),
  likeCount: z.number().default(0),
  isLiked: z.boolean().default(false),
  editedAt: z.string().nullable().optional(),
})

export const ProfileCommentSchema = BaseProfileCommentSchema.extend({
  replies: BaseProfileCommentSchema.array().default([]),
})
export type ProfileComment = z.infer<typeof ProfileCommentSchema>

export const UpdatePhotoCaptionSchema = z.object({
  caption: z.string().max(500).optional(),
})
export type UpdatePhotoCaptionInput = z.infer<typeof UpdatePhotoCaptionSchema>
