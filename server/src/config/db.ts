import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI)
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
