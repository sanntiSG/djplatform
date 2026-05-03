import 'dotenv/config'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { hashPassword } from '../utils/password.js'

async function seed() {
  await mongoose.connect(env.MONGODB_URI)

  const password = env.ADMIN_INITIAL_PASSWORD ?? crypto.randomBytes(12).toString('hex')
  const hashed = await hashPassword(password)

  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL },
    {
      $setOnInsert: { email: env.ADMIN_EMAIL },
      $set: { role: 'admin', password: hashed, mustChangePassword: true },
    },
    { upsert: true, new: true },
  )

  if (!env.ADMIN_INITIAL_PASSWORD) {
    console.log('==============================')
    console.log('Admin creado con password generado:')
    console.log(`Email:    ${admin.email}`)
    console.log(`Password: ${password}`)
    console.log('Cambia esta contrasena en el primer login.')
    console.log('==============================')
  } else {
    console.log(`Admin ${admin.email} creado/actualizado correctamente.`)
  }

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
