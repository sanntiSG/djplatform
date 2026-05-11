export function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function profilePath(slug: string, id: string) {
  return `/p/${slug}-${id}`
}

export function eventPath(slug: string, id: string) {
  return `/events/${slug}-${id}`
}

export function genrePath(name: string) {
  return `/g/${toSlug(name)}`
}
