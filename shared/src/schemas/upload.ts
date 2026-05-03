import { z } from 'zod'

export const UploadFolderSchema = z.enum(['dj/avatars', 'dj/covers', 'dj/profile-covers', 'dj/media'])
export type UploadFolder = z.infer<typeof UploadFolderSchema>

export const UploadSignatureInputSchema = z.object({
  folder: UploadFolderSchema,
})
export type UploadSignatureInput = z.infer<typeof UploadSignatureInputSchema>

export const UploadSignatureOutputSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  folder: z.string(),
  apiKey: z.string(),
  cloudName: z.string(),
})
export type UploadSignatureOutput = z.infer<typeof UploadSignatureOutputSchema>
