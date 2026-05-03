import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('MongoDB conectado')
  } catch (err) {
    console.error('Error conectando a MongoDB:', err)
    throw err // Lanzamos para que index.ts decida que hacer
  }
}
