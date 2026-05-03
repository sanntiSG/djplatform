import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { Genre } from '../models/Genre.js'
import { EventType } from '../models/EventType.js'
import { INITIAL_GENRES, INITIAL_EVENT_TYPES } from '@dj/shared'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  await mongoose.connect(env.MONGODB_URI)

  for (let i = 0; i < INITIAL_GENRES.length; i++) {
    const name = INITIAL_GENRES[i]
    const slug = toSlug(name)
    await Genre.updateOne({ slug }, { $setOnInsert: { name, slug, isActive: true, order: i } }, { upsert: true })
  }

  for (let i = 0; i < INITIAL_EVENT_TYPES.length; i++) {
    const name = INITIAL_EVENT_TYPES[i]
    const slug = toSlug(name)
    await EventType.updateOne({ slug }, { $setOnInsert: { name, slug, isActive: true, order: i } }, { upsert: true })
  }

  console.log(`Generos: ${INITIAL_GENRES.length} upserted`)
  console.log(`Tipos de evento: ${INITIAL_EVENT_TYPES.length} upserted`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Error en seedCatalogs:', err)
  process.exit(1)
})
