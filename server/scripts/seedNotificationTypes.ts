import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { NotificationType } from '../src/models/NotificationType.js'

const types = [
  // Categoria: profile — disponibles para todos los usuarios
  { key: 'follow_new',       label: 'Nuevos seguidores',    description: 'Alguien sigue tu perfil',              category: 'profile' },
  { key: 'profile_like',     label: 'Me gusta en perfil',   description: 'Alguien le da me gusta a tu perfil',   category: 'profile' },
  { key: 'profile_comment',  label: 'Comentarios en perfil',description: 'Alguien comenta en tu perfil',         category: 'profile' },
  { key: 'content_like',     label: 'Me gusta en contenido',description: 'Alguien le da me gusta a tu contenido',category: 'profile' },
  { key: 'content_comment',  label: 'Comentarios en contenido',description: 'Alguien comenta en tu contenido',  category: 'profile' },
  { key: 'media_like',       label: 'Me gusta en musica',   description: 'Alguien reacciona a tu musica',        category: 'profile' },

  // Categoria: all — solo para usuarios con nivel "Todas"
  { key: 'event_new_followed_profile', label: 'Nuevo evento de seguidos', description: 'Un perfil que seguis publico un evento nuevo', category: 'all' },
  { key: 'event_new_genre_match',      label: 'Evento de tu genero',      description: 'Nuevo evento de un genero de tu interes',     category: 'all' },
  { key: 'chat_message_new',           label: 'Mensaje recibido',          description: 'Recibi un mensaje privado nuevo',             category: 'all' },
  { key: 'chat_message_reply',         label: 'Respuesta a mensaje',       description: 'Alguien respondio a tu mensaje',              category: 'all' },
]

async function seed() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Conectado a MongoDB')

  let created = 0
  let skipped = 0

  for (const type of types) {
    const existing = await NotificationType.findOne({ key: type.key })
    if (existing) {
      skipped++
    } else {
      await NotificationType.create(type)
      created++
    }
  }

  console.log(`Seed completo: ${created} creados, ${skipped} ya existentes`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
