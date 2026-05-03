import type { Request, Response, NextFunction } from 'express'
import { UploadSignatureInputSchema } from '@dj/shared'
import { signUpload } from '../services/cloudinaryService.js'

export async function getSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const { folder } = UploadSignatureInputSchema.parse(req.body)
    const result = signUpload(folder)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
