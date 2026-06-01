import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 20,          // suficiente para una instancia; escalar con replicas
      minPoolSize: 2,           // mantener conexiones calientes
      serverSelectionTimeoutMS: 5000,  // falla rapido si Atlas no responde
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,     // libera conexiones ociosas antes del idle de Atlas
      family: 4,                // forzar IPv4 — evita demora de doble-resolución en Render
    })
    console.log('MongoDB conectado')

    // Limpieza de indices viejos que causan errores 500 (E11000)
    try {
      const db = mongoose.connection.db
      if (db) {
        const collections = await db.listCollections({ name: 'profilefollows' }).toArray()
        if (collections.length > 0) {
          await db.collection('profilefollows').dropIndex('profileId_1_userId_1').catch(() => {})
        }
      }
    } catch (e) {
      // Ignorar si el indice no existe
    }
  } catch (err) {
    console.error('Error conectando a MongoDB:', err)
    throw err // Lanzamos para que index.ts decida que hacer
  }
}
