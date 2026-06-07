import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { NotificationType } from '../models/NotificationType.js'
import { NOTIFICATION_TYPE_DEFS } from '../services/notificationTypeSeed.js'

async function seed() {
  await mongoose.connect(env.MONGODB_URI)

  let upserted = 0
  for (const t of NOTIFICATION_TYPE_DEFS) {
    const result = await NotificationType.updateOne(
      { key: t.key },
      { $setOnInsert: { key: t.key, label: t.label, description: t.description, category: t.category, enabledByAdmin: true } },
      { upsert: true },
    )
    if (result.upsertedCount) upserted++
  }

  console.log(`Tipos de notificacion: ${NOTIFICATION_TYPE_DEFS.length} procesados, ${upserted} nuevos insertados`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Error en seedNotificationTypes:', err)
  process.exit(1)
})
