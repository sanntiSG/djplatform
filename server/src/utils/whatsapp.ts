export function normalizeWhatsApp(raw: string): string {
  // Remove all non-digit chars
  let digits = raw.replace(/\D/g, '')

  // Argentina: if starts with 0 (area code with leading 0), remove it
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // If local format (10 digits), prepend 549
  if (digits.length === 10) {
    return `549${digits}`
  }

  // If already has country code 54 but missing the 9 mobile prefix
  if (digits.startsWith('54') && digits.length === 12) {
    return `549${digits.slice(2)}`
  }

  // If already in 549XXXXXXXXXX format (13 digits)
  if (digits.startsWith('549') && digits.length === 13) {
    return digits
  }

  // Return as-is, let Mongoose validation handle it if needed
  return digits
}

export function buildWhatsAppLink(normalized: string, msg = ''): string {
  const encoded = msg ? `?text=${encodeURIComponent(msg)}` : ''
  return `https://wa.me/${normalized}${encoded}`
}

export const DEFAULT_WHATSAPP_MSG =
  'Hola! Te escribo desde DJPlatform, vi tu perfil y me interesa contactarte.'
