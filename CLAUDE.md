# CLAUDE.md — Contexto del Proyecto

## Nombre del proyecto

Plataforma web para DJs y servicios musicales en Argentina (nombre definitivo a definir).

---

## Descripcion general

Plataforma que conecta a DJs, productores y perfiles musicales con clientes que buscan contratar esos servicios en Argentina. Funciona como una red de perfiles profesionales orientada al mundo de la musica electronica y eventos. La experiencia es completamente visual, moderna y premium, con foco en imagen, video y movimiento.

---

## Pais de operacion

Solo Argentina. Todos los filtros de ubicacion, referencias geograficas y logica de negocio estan pensados para el mercado argentino.

---

## Stack tecnologico

| Capa             | Tecnologia                          |
|------------------|-------------------------------------|
| Frontend         | React + Vite + TypeScript           |
| Estilos          | Tailwind CSS                        |
| Animaciones      | GSAP (ScrollTrigger incluido)       |
| Estado global    | Zustand                             |
| Backend          | Node.js + Express                   |
| Base de datos    | MongoDB Atlas + Mongoose            |
| Autenticacion    | OAuth Google + Email/Password + JWT |
| Archivos         | Cloudinary                          |
| Deploy frontend  | Netlify                             |
| Deploy backend   | Render                              |

---

## Estructura de usuarios

- Una sola cuenta por usuario.
- El registro es simple: email/password o Google OAuth.
- Despues del registro, el usuario puede optar por:
  - Solo buscar servicios (cliente)
  - Ofrecer servicios (crear un perfil publico)
- Esta eleccion no es obligatoria en el registro inicial.
- Existe un rol `admin` para administracion de la plataforma.

---

## Roles

| Rol    | Descripcion                                                             |
|--------|-------------------------------------------------------------------------|
| user   | Usuario comun. Puede buscar, ver perfiles y contactar por WhatsApp.     |
| admin  | Acceso total al panel de administracion. Modera perfiles y contenidos.  |

El usuario administrador inicial es el registrado con `ssantii200@gmail.com` y su contraseña es la misma del mail.

---

## Perfiles de servicio

Los perfiles son altamente personalizables. No son solo texto libre, tienen campos estructurados para facilitar busquedas y filtros.

Campos principales:
- Nombre artistico
- Foto de perfil (Cloudinary)
- Bio
- Ubicacion
- Generos musicales (array)
- Tipo de eventos o fiestas (array)
- Disponibilidad (`available` / `contact` / `unavailable`)
- Numero de WhatsApp para contacto
- Medios embebidos (Spotify, SoundCloud, YouTube)
- Eventos publicados
- Rango de precio (se muestra como "Consultar", no valor exacto)
- Estado de visibilidad (moderacion por admin)

Tipos de perfil soportados:
- `dj`
- `producer`
- `other`

---

## Logica de medios embebidos

Los usuarios agregan una URL. El sistema detecta la plataforma automaticamente.

| Plataforma  | Logica                                                                                      |
|-------------|---------------------------------------------------------------------------------------------|
| YouTube     | Se extrae el ID del video. Se renderiza con `youtube.com/embed/ID`. Sin restricciones CORS. |
| SoundCloud  | Backend consulta oEmbed publico. Se guarda el `embedHtml` en MongoDB.                       |
| Spotify     | Se extrae el ID. Se renderiza con `open.spotify.com/embed/track/ID`. Estilo limitado.       |

Estructura guardada en MongoDB por cada medio:
```json
{
  "platform": "youtube | soundcloud | spotify",
  "url": "url original del usuario",
  "embedId": "ID extraido (YouTube y Spotify)",
  "embedHtml": "iframe HTML (solo SoundCloud)",
  "type": "audio | video",
  "title": "titulo opcional"
}
```

Las imagenes (foto de perfil, portadas de eventos) se suben a Cloudinary. En MongoDB se guarda solo la URL. Nunca se guardan binarios en la base de datos.

---

## Eventos

Los perfiles que ofrecen servicios pueden publicar eventos.

Campos de un evento:
- Titulo
- Fecha
- Descripcion
- Ubicacion
- Portada (Cloudinary URL)
- Medios adicionales (URLs)
- Estado de visibilidad (moderacion)

Los eventos se pueden ver:
- En el perfil del DJ o proveedor
- En una seccion general de la plataforma (estilo feed de red social)

Desde un evento, el usuario puede contactar al servicio via WhatsApp.

---

## Busqueda y filtros

Filtros disponibles:
- Ubicacion
- Genero musical
- Tipo de fiesta o evento
- Disponibilidad
- Rango de precio (siempre mostrado como "Consultar")

La busqueda debe ser simple, rapida y clara. No es un motor complejo.

---

## Contacto

El unico canal de contacto es WhatsApp. Cada perfil configura su numero. El boton de contacto genera un link directo a WhatsApp con mensaje predefinido opcional.

---

## Panel de administracion

Accesible solo para usuarios con rol `admin`.

Funcionalidades:
- Moderacion de perfiles (aprobar, ocultar, eliminar)
- Moderacion de fotos
- Moderacion de eventos
- Estadisticas basicas de uso:
  - Total de usuarios registrados
  - Total de perfiles activos
  - Total de eventos publicados
  - Nuevos registros por periodo

---

## Diseno y experiencia

**Estetica:** Oscura, descontracturada, premium. Inspirada en iOS, Apple Music e Instagram. No recargada. Liviana y clara.

**Tipografias:** Llamativas y expresivas. No usar Inter, Roboto ni fuentes genericas.

**Colores:** Paleta oscura con acentos bien definidos. CSS variables para consistencia total.

**Animaciones con GSAP:**
- ScrollTrigger para elementos que aparecen al hacer scroll
- Textos que aparecen de forma progresiva
- Imagenes con transicion de entrada
- Bloques visuales con movimiento sutil

**Responsive:** Totalmente adaptado a mobile, tablet y desktop.

**Reglas de diseno:**
- Sin emojis en codigo ni en interfaz
- Bordes redondeados en todos los componentes
- Foco en imagen, video y movimiento
- Coherencia visual en toda la aplicacion

---

## Variables de entorno

### Frontend (`client/.env`)
```
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
```

### Backend (`server/.env`)
```
PORT=
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
ADMIN_EMAIL=ssantii200@gmail.com
```

---

## Estructura de carpetas

```
djplatform/
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── profile/
│   │   │   ├── events/
│   │   │   ├── search/
│   │   │   └── admin/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── .env
│   └── vite.config.ts
│
└── server/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    ├── .env
    └── index.ts
```

---

## Esquemas principales de MongoDB

### User
```ts
{
  email: string
  password?: string        // opcional si usa Google
  googleId?: string
  role: 'user' | 'admin'
  createdAt: Date
  profileId?: ObjectId
}
```

### Profile
```ts
{
  userId: ObjectId
  type: 'dj' | 'producer' | 'other'
  artistName: string
  bio: string
  avatar: string           // URL Cloudinary
  location: string
  genres: string[]
  eventTypes: string[]
  availability: 'available' | 'contact' | 'unavailable'
  whatsapp: string
  media: MediaItem[]
  priceRange?: string      // siempre "Consultar" en UI
  isVisible: boolean
  createdAt: Date
}
```

### Event
```ts
{
  profileId: ObjectId
  title: string
  description: string
  date: Date
  location: string
  cover: string            // URL Cloudinary
  media: string[]
  isVisible: boolean
  createdAt: Date
}
```

---

## Escalabilidad futura

La arquitectura debe permitir agregar en el futuro:
- Sistema de resenas
- Pagos y monetizacion
- Eventos en vivo
- Rankings de perfiles
- Mensajeria interna

No implementar ninguna de estas funcionalidades en el MVP. Solo dejar la arquitectura preparada para recibirlas.

---

## Reglas del proyecto

- No usar emojis en codigo ni en interfaz
- No modificar el MVP base sin autorizacion explicita
- Mantener coherencia visual y estructural en toda la aplicacion
- Priorizar claridad, estetica y experiencia fluida
- Todo debe sentirse profesional, moderno y visualmente fuerte
- Nunca guardar archivos binarios en MongoDB
- Nunca hardcodear credenciales en el codigo
