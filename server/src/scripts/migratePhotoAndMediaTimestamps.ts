import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI no definido en .env')
  process.exit(1)
}

async function migrate() {
  await mongoose.connect(MONGODB_URI!)
  console.log('Conectado a MongoDB. Iniciando migracion de timestamps...')

  const db = mongoose.connection.db!
  const profiles = db.collection('profiles')

  const all = await profiles.find({}).toArray()
  console.log(`Perfiles encontrados: ${all.length}`)

  let updated = 0

  for (const profile of all) {
    const fallback: Date = profile.updatedAt ?? profile.createdAt ?? new Date()
    const updates: Record<string, unknown> = {}

    // Migrate photos: string[] → { url, addedAt }[]
    const rawPhotos: unknown[] = profile.photos ?? []
    const needsPhotoMigration = rawPhotos.some((p) => typeof p === 'string')
    if (needsPhotoMigration) {
      updates.photos = rawPhotos.map((p) => {
        if (typeof p === 'string') return { url: p, addedAt: fallback }
        const ph = p as { url: string; addedAt?: Date }
        return { url: ph.url, addedAt: ph.addedAt ?? fallback }
      })
    }

    // Migrate media: add addedAt where missing
    const rawMedia: unknown[] = profile.media ?? []
    const needsMediaMigration = rawMedia.some((m) => {
      const item = m as { addedAt?: Date }
      return !item.addedAt
    })
    if (needsMediaMigration) {
      updates.media = rawMedia.map((m) => {
        const item = m as { addedAt?: Date }
        if (!item.addedAt) return { ...item, addedAt: fallback }
        return item
      })
    }

    if (Object.keys(updates).length > 0) {
      await profiles.updateOne({ _id: profile._id }, { $set: updates })
      updated++
    }
  }

  console.log(`Migracion completada. Perfiles actualizados: ${updated}`)
  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error('Error en migracion:', err)
  process.exit(1)
})
