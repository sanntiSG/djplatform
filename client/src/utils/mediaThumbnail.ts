export function getMediaThumbnail(
  platform: string,
  embedId?: string,
  thumbnailUrl?: string,
): string | undefined {
  if (thumbnailUrl) return thumbnailUrl
  if (platform === 'youtube' && embedId)
    return `https://img.youtube.com/vi/${embedId}/hqdefault.jpg`
  return undefined
}
