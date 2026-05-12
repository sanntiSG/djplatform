import https from 'https'

interface GeorefLocalidad {
  id: string
  nombre: string
  provincia: { nombre: string }
  municipio?: { nombre: string }
  centroide?: { lat: number; lon: number }
}

interface GeorefProvincia {
  id: string
  nombre: string
}

interface LocationResult {
  id: string
  name: string
  province: string
  lat?: number
  lon?: number
}

interface ProvinceResult {
  id: string
  name: string
}

// Simple in-memory LRU cache
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX = 500
const cache = new Map<string, { value: unknown; expiresAt: number }>()

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.value as T
}

function cacheSet(key: string, value: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

function georefFetch<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = `https://apis.datos.gob.ar/georef/api${path}`
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data) as T) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

export async function searchLocations(q: string): Promise<LocationResult[]> {
  if (!q || q.trim().length < 2) return []
  const key = `loc:${q.trim().toLowerCase()}`
  const cached = cacheGet<LocationResult[]>(key)
  if (cached) return cached

  const encoded = encodeURIComponent(q.trim())
  const res = await georefFetch<{ localidades: GeorefLocalidad[] }>(
    `/localidades?nombre=${encoded}&max=8&campos=id,nombre,provincia.nombre,centroide`,
  )

  const results: LocationResult[] = (res.localidades ?? []).map((l) => ({
    id: l.id,
    name: l.nombre,
    province: l.provincia.nombre,
    lat: l.centroide?.lat,
    lon: l.centroide?.lon,
  }))

  cacheSet(key, results)
  return results
}

export async function getProvinces(): Promise<ProvinceResult[]> {
  const key = 'provinces'
  const cached = cacheGet<ProvinceResult[]>(key)
  if (cached) return cached

  const res = await georefFetch<{ provincias: GeorefProvincia[] }>(
    '/provincias?max=25&campos=id,nombre&orden=nombre',
  )

  const results: ProvinceResult[] = (res.provincias ?? []).map((p) => ({
    id: p.id,
    name: p.nombre,
  }))

  cacheSet(key, results)
  return results
}
