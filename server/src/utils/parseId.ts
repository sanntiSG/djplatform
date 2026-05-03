export function parseObjectId(param: string): string {
  const match = param.match(/[0-9a-fA-F]{24}$/)
  return match ? match[0] : param
}
