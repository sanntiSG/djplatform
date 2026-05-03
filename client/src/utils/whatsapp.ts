export function buildWhatsAppLink(normalized: string, msg?: string): string {
  const text = msg ?? 'Hola! Te escribo desde DJPlatform, vi tu perfil y me interesa contactarte.'
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
}
