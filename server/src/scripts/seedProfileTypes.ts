import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { ProfileType } from '../models/ProfileType.js'

const BASE_TYPES = [
  { name: 'DJ', slug: 'dj', order: 1, isProtected: true },
  { name: 'Productor', slug: 'producer', order: 2, isProtected: true },
  { name: 'Artista', slug: 'other', order: 3, isProtected: true },
]

async function seed() {
  await mongoose.connect(env.MONGODB_URI)
  for (const t of BASE_TYPES) {
    await ProfileType.updateOne(
      { slug: t.slug },
      { $setOnInsert: { ...t, isActive: true } },
      { upsert: true },
    )
    console.log(`[seed] ProfileType "${t.slug}" ok`)
  }
  await mongoose.disconnect()
}

seed().catch((e) => { console.error(e); process.exit(1) })
