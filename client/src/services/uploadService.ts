import { apiClient } from './apiClient.js'
import type { UploadSignatureOutput, UploadFolder } from '../types/index.js'

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const sig = await apiClient.post<UploadSignatureOutput>('/uploads/signature', { folder })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.apiKey)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    throw new Error('Error al subir la imagen a Cloudinary')
  }

  const data = (await res.json()) as { secure_url: string }
  return data.secure_url
}
