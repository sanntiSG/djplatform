import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { NotificationType } from '../models/NotificationType.js'

const TYPES: Array<{
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
}> = [
  { key: 'follow_new',                  label: 'Nuevo seguidor',             description: 'Alguien empezo a seguir tu perfil',                    category: 'all' },
  { key: 'profile_like',                label: 'Me gusta en perfil',         description: 'Alguien le dio me gusta a tu perfil',                  category: 'all' },
  { key: 'profile_comment',             label: 'Comentario en perfil',       description: 'Alguien comento en tu perfil',                         category: 'all' },
  { key: 'content_like',                label: 'Me gusta en contenido',      description: 'Alguien reacciono a tu evento o publicacion',          category: 'all' },
  { key: 'content_comment',             label: 'Comentario en contenido',    description: 'Alguien comento en tu evento',                         category: 'all' },
  { key: 'media_like',                  label: 'Me gusta en musica',         description: 'Alguien reacciono a tu pista o media',                 category: 'all' },
  { key: 'event_new_followed_profile',  label: 'Evento de seguido',          description: 'Un perfil que seguis publico un nuevo evento',         category: 'profile' },
  { key: 'event_new_genre_match',       label: 'Evento de tu genero',        description: 'Hay un nuevo evento en tu genero favorito',            category: 'all' },
  { key: 'event_attend',                label: 'Asistencia confirmada',      description: 'Alguien confirmo asistencia a tu evento',              category: 'all' },
  { key: 'chat_message_new',            label: 'Mensaje nuevo',              description: 'Recibiste un mensaje privado',                         category: 'profile' },
  { key: 'chat_message_reply',          label: 'Respuesta a mensaje',        description: 'Alguien respondio tu mensaje',                         category: 'profile' },
  { key: 'collab_request',              label: 'Propuesta de colaboracion',  description: 'Alguien te propuso una colaboracion',                  category: 'profile' },
  { key: 'collab_confirmed',            label: 'Colaboracion confirmada',    description: 'Una colaboracion que propusiste fue confirmada',        category: 'profile' },
  { key: 'opportunity_new_application',    label: 'Nueva postulacion',          description: 'Alguien se postulo a tu oportunidad',                          category: 'profile' },
  { key: 'opportunity_closed',             label: 'Oportunidad cerrada',        description: 'Una oportunidad a la que te postulaste se cerro',               category: 'profile' },
  { key: 'opportunity_application_accepted', label: 'Postulacion aceptada',     description: 'Tu postulacion fue aceptada por el creador de la oportunidad',  category: 'profile' },
  { key: 'opportunity_application_cancelled', label: 'Postulacion cancelada',   description: 'Un artista cancelo su postulacion a tu oportunidad',            category: 'profile' },
  { key: 'opportunity_filled_other',       label: 'Oportunidad cubierta',       description: 'La oportunidad fue cubierta con otro artista',                  category: 'profile' },
  { key: 'opportunity_cancelled',          label: 'Oportunidad cancelada',      description: 'El creador cerro o elimino la oportunidad',                     category: 'profile' },
  { key: 'project_new_application',       label: 'Solicitud de ingreso',        description: 'Alguien quiere unirse a tu proyecto',                            category: 'profile' },
  { key: 'project_application_accepted',  label: 'Ingreso aceptado',            description: 'Tu solicitud para unirte al proyecto fue aceptada',               category: 'profile' },
]

async function seed() {
  await mongoose.connect(env.MONGODB_URI)

  let upserted = 0
  for (const t of TYPES) {
    const result = await NotificationType.updateOne(
      { key: t.key },
      { $setOnInsert: { key: t.key, label: t.label, description: t.description, category: t.category, enabledByAdmin: true } },
      { upsert: true },
    )
    if (result.upsertedCount) upserted++
  }

  console.log(`Tipos de notificacion: ${TYPES.length} procesados, ${upserted} nuevos insertados`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Error en seedNotificationTypes:', err)
  process.exit(1)
})
