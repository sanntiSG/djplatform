import { z } from 'zod'

export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  order: z.number(),
})
export type CatalogItem = z.infer<typeof CatalogItemSchema>
