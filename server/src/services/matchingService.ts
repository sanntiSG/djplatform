import { Profile, type IProfile } from '../models/Profile.js'
import { ProfileFollow } from '../models/ProfileFollow.js'
import type { Types } from 'mongoose'

const CACHE_TTL = 30 * 60 * 1000

interface SuggestionResult {
  id: string
  slug: string
  userId: string
  artistName: string
  avatar?: string
  type: string
  roles: string[]
  location?: string
  openToWork: boolean
  score: number
  reason: string
}

const cache = new Map<string, { expires: number; data: SuggestionResult[] }>()

function normalizeLocation(loc?: string): string {
  if (!loc) return ''
  return loc.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function locationMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  const na = normalizeLocation(a)
  const nb = normalizeLocation(b)
  if (na === nb) return true
  const wordsA = na.split(/[\s,]+/).filter((w) => w.length >= 3)
  return wordsA.some((w) => nb.includes(w))
}

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function computeScore(
  me: IProfile,
  candidate: IProfile,
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const sharedGenres = me.genres.filter((g) => candidate.genres.includes(g))
  if (sharedGenres.length > 0) {
    score += 3
    reasons.push(sharedGenres[0])
  }

  const myLookingFor: string[] = (me as any).lookingFor ?? []
  const candidateRoles: string[] = (candidate as any).roles ?? []
  const complementary = myLookingFor.filter((r) => candidateRoles.includes(r))
  if (complementary.length > 0) {
    score += 3
    const LABEL: Record<string, string> = {
      dj: 'DJ', producer: 'Productor', vocalist: 'Vocalista',
      designer: 'Disenador', organizer: 'Organizador', visuals: 'Visuales',
    }
    reasons.push(LABEL[complementary[0]] ?? complementary[0])
  }

  if (locationMatch(me.location, candidate.location)) {
    score += 2
    const city = (candidate.location ?? '').split(',')[0].trim()
    if (city) reasons.push(city)
  }

  if ((candidate as any).openToWork) {
    score += 1
    reasons.push('Open to work')
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  if (candidate.updatedAt && candidate.updatedAt.getTime() > thirtyDaysAgo) {
    score += 1
  }

  const sharedEventTypes = (me.eventTypes ?? []).filter((e) => (candidate.eventTypes ?? []).includes(e))
  if (sharedEventTypes.length > 0) {
    score += 0.5
  }

  return { score, reasons }
}

export async function getSuggestionsFor(profileId: string, userId: string, limit = 8): Promise<SuggestionResult[]> {
  const cached = cache.get(profileId)
  if (cached && cached.expires > Date.now()) return cached.data.slice(0, limit)

  const me = await Profile.findById(profileId)
  if (!me) return []

  const follows = await ProfileFollow.find({ followerId: userId }).lean()
  const followedProfileIds = new Set(follows.map((f) => (f.followedId as Types.ObjectId).toString()))

  // Proyeccion estricta: solo campos usados en computeScore + serializacion del resultado
  // Sin esto se traian 400 documentos completos (con media[], photos[], bio, etc.)
  const candidates = await Profile.find({
    _id: { $ne: me._id },
    userId: { $ne: userId },
    isVisible: true,
  })
    .select('artistName avatar type slug userId genres roles eventTypes location openToWork updatedAt')
    .limit(400)
    .lean() as unknown as IProfile[]

  const scored = candidates
    .filter((c) => !followedProfileIds.has((c._id as Types.ObjectId).toString()))
    .map((c) => {
      const { score, reasons } = computeScore(me, c)
      return {
        id: (c._id as Types.ObjectId).toString(),
        slug: toSlug(c.artistName),
        userId: (c.userId as Types.ObjectId).toString(),
        artistName: c.artistName,
        avatar: c.avatar,
        type: c.type,
        roles: (c as any).roles ?? [],
        location: c.location,
        openToWork: (c as any).openToWork ?? false,
        score,
        reason: reasons.slice(0, 3).join(' · '),
      }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  cache.set(profileId, { expires: Date.now() + CACHE_TTL, data: scored })

  return scored.slice(0, limit)
}
