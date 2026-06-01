/**
 * Genera URLs de Cloudinary con transformaciones optimizadas.
 *
 * En lugar de servir imágenes full-res a toda la app, este helper reescribe
 * las URLs para aplicar: tamaño adecuado al display, calidad auto (q_auto) y
 * formato moderno (f_auto, p.ej. WebP en navegadores compatibles).
 *
 * Uso:
 *   <img src={cloudinaryUrl(avatar, { w: 64, h: 64 })} />
 *   <img src={cloudinaryUrl(cover,  { w: 400, h: 300, fit: 'fill' })} />
 *
 * Si la URL no es de Cloudinary (o no tiene transformaciones disponibles),
 * devuelve la URL original sin modificar — nunca rompe.
 */

export interface CloudinaryOptions {
  w?: number
  h?: number
  fit?: 'fill' | 'fit' | 'crop' | 'thumb' | 'scale'
  q?: 'auto' | 'auto:low' | 'auto:good' | 'auto:eco' | number
  f?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  gravity?: 'face' | 'center' | 'auto'
}

const CLOUDINARY_UPLOAD_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/

export function cloudinaryUrl(url: string | undefined | null, opts: CloudinaryOptions = {}): string {
  if (!url) return ''

  const match = url.match(CLOUDINARY_UPLOAD_RE)
  if (!match) return url  // no es Cloudinary o es video/raw — devolver sin cambios

  const [, base, rest] = match

  // Construir string de transformaciones
  const parts: string[] = []
  if (opts.w)              parts.push(`w_${opts.w}`)
  if (opts.h)              parts.push(`h_${opts.h}`)
  if (opts.fit ?? 'fill')  parts.push(`c_${opts.fit ?? 'fill'}`)
  if (opts.gravity)        parts.push(`g_${opts.gravity}`)
  parts.push(`q_${opts.q ?? 'auto'}`)
  parts.push(`f_${opts.f ?? 'auto'}`)

  const transform = parts.join(',')

  // Insertar las transformaciones antes del path de version/publicId
  // Evitar duplicar transformaciones si ya hay una capa
  const alreadyTransformed = rest.startsWith('w_') || rest.startsWith('c_') || rest.startsWith('q_')
  if (alreadyTransformed) return url

  return `${base}${transform}/${rest}`
}
