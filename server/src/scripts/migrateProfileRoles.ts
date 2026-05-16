import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI no definido en .env')
  process.exit(1)
}

async function migrate() {
  await mongoose.connect(MONGODB_URI!)
  console.log('Conectado a MongoDB. Iniciando migracion de roles profesionales...')

  const db = mongoose.connection.db!
  const profiles = db.collection('profiles')

  const all = await profiles.find({}).toArray()
  console.log(`Perfiles encontrados: ${all.length}`)

  let updated = 0

  for (const profile of all) {
    if (profile.roles && profile.roles.length > 0) continue

    const type: string = profile.type ?? 'other'
    const roles: string[] = []

    if (type === 'dj') roles.push('dj')
    else if (type === 'producer') roles.push('producer')

    await profiles.updateOne(
      { _id: profile._id },
      {
        $set: {
          roles,
          lookingFor: profile.lookingFor ?? [],
          openToWork: profile.openToWork ?? false,
          influences: profile.influences ?? [],
          tools: profile.tools ?? [],
        },
      },
    )
    updated++
  }

  console.log(`Migracion completada. Perfiles actualizados: ${updated}`)
  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error('Error en migracion:', err)
  process.exit(1)
})
