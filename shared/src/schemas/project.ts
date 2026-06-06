import { z } from 'zod'

export const PROJECT_PHASES = ['idea', 'progress', 'recording', 'mixing', 'released'] as const
export type ProjectPhase = typeof PROJECT_PHASES[number]

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  idea:      'Idea inicial',
  progress:  'En progreso',
  recording: 'Grabacion',
  mixing:    'Mezcla',
  released:  'Lanzado',
}

export const CreateProjectSchema = z.object({
  title:           z.string().min(3, 'Titulo muy corto').max(120),
  description:     z.string().max(2000).optional(),
  cover:           z.string().url().optional(),
  genres:          z.array(z.string()).max(10).default([]),
  location:        z.string().max(100).optional(),
  lookingForRoles: z.array(z.string().max(40)).max(6).default([]),
  phase:           z.enum(PROJECT_PHASES).default('idea'),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: z.enum(['open', 'closed']).optional(),
})
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export const ProjectMemberSchema = z.object({
  id:        z.string(),
  profileId: z.string(),
  userId:    z.string(),
  artistName: z.string(),
  avatar:    z.string().optional(),
  slug:      z.string(),
  role:      z.string(),
  status:    z.enum(['pending', 'member', 'rejected']),
  isCreator: z.boolean(),
  joinedAt:  z.string().optional(),
})
export type ProjectMember = z.infer<typeof ProjectMemberSchema>

export const ProjectResponseSchema = z.object({
  id:              z.string(),
  profileId:       z.string(),
  userId:          z.string(),
  artistName:      z.string(),
  avatar:          z.string().optional(),
  artistSlug:      z.string(),
  title:           z.string(),
  description:     z.string().optional(),
  cover:           z.string().optional(),
  genres:          z.array(z.string()),
  location:        z.string().optional(),
  lookingForRoles: z.array(z.string()),
  phase:           z.enum(PROJECT_PHASES),
  status:          z.enum(['open', 'closed']),
  memberCount:     z.number(),
  pendingCount:    z.number(),
  isApplied:       z.boolean(),
  isMember:        z.boolean(),
  members:         z.array(ProjectMemberSchema).optional(), // solo cuando es el creador
  createdAt:       z.string(),
})
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>

export const ApplyProjectSchema = z.object({
  role:    z.string().max(40).optional(),
  message: z.string().max(280).optional(),
})
export type ApplyProjectInput = z.infer<typeof ApplyProjectSchema>
