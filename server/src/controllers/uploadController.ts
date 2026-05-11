import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { UploadSignatureInputSchema } from '@dj/shared'
import { signUpload, destroyAsset } from '../services/cloudinaryService.js'

export async function getSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const { folder } = UploadSignatureInputSchema.parse(req.body)
    const result = signUpload(folder)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const DeleteAssetSchema = z.object({
  url: z.string().url(),
})

export async function deleteAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = DeleteAssetSchema.parse(req.body)
    // Only allow deletion of Cloudinary URLs from our cloud
    if (!url.includes('res.cloudinary.com')) {
      res.status(400).json({ error: 'URL no valida para eliminar' })
      return
    }
    await destroyAsset(url)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
