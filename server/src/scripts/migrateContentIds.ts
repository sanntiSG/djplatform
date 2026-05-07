import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { Profile } from '../models/Profile.js'

async function run() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Conectado a MongoDB')

  const profiles = await Profile.find({})
  let migrated = 0

  for (const profile of profiles) {
    let dirty = false

    for (const photo of profile.photos ?? []) {
      const p = photo as unknown as { _id?: mongoose.Types.ObjectId }
      if (!p._id) {
        p._id = new mongoose.Types.ObjectId()
        dirty = true
      }
    }

    if (dirty) {
      await profile.save()
      migrated++
    }
  }

  console.log(`Migración completa. Profiles actualizados: ${migrated}`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
