import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import type { UploadFolder, UploadSignatureOutput } from '@dj/shared'

export function signUpload(folder: UploadFolder): UploadSignatureOutput {
  if (!isCloudinaryConfigured) {
    throw Object.assign(new Error('Cloudinary no esta configurado'), { status: 503 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  )

  return {
    signature,
    timestamp,
    folder,
    apiKey: env.CLOUDINARY_API_KEY!,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
  }
}

export function extractPublicId(url: string): string | null {
  // Match: .../upload/[transformations/]vNNNNNNNNNN/<publicId_with_folder>.<ext>
  const match = url.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-z0-9]+$/i)
  return match ? match[1] : null
}

export async function destroyAsset(url: string): Promise<void> {
  if (!isCloudinaryConfigured) return
  const publicId = extractPublicId(url)
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    logger.error('Cloudinary destroy failed', { publicId, err })
  }
}
