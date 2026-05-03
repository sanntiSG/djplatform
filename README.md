# DJPlatform

Plataforma de DJs y servicios musicales en Argentina.

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta en MongoDB Atlas
- Cuenta en Google Cloud (para OAuth)
- Cuenta en Cloudinary (para imagenes, necesario desde Fase 3)

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Editar `server/.env` con:
- `MONGODB_URI` — connection string de MongoDB Atlas
- `JWT_SECRET` — string aleatorio y seguro (min 32 chars)
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` — desde Google Cloud Console
- `ADMIN_INITIAL_PASSWORD` — password inicial del admin (si se omite, se genera uno aleatorio)

Editar `client/.env` con:
- `VITE_GOOGLE_CLIENT_ID` — el mismo Google Client ID

### 3. Crear el usuario admin

```bash
npm run seed:admin
```

Si `ADMIN_INITIAL_PASSWORD` no esta configurada, el password se imprime una sola vez en la consola.

### 4. Iniciar en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

## Estructura del proyecto

```
djplatform/
├── client/     # React + Vite + TS + Tailwind + GSAP
├── server/     # Node.js + Express + MongoDB + Mongoose
└── shared/     # Schemas Zod y tipos compartidos
```

## Scripts disponibles

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Arranca client y server en paralelo |
| `npm run build` | Compila los 3 workspaces |
| `npm run typecheck` | Verificacion de tipos en los 3 workspaces |
| `npm run lint` | Linting en client y server |
| `npm run seed:admin` | Crea/actualiza el usuario admin |

## Roadmap MVP

- [x] Fase 0+1: Scaffolding, landing premium, auth completo
- [ ] Fase 2: Perfiles de servicio (DJ, productor, other)
- [ ] Fase 3: Cloudinary uploads + embeds (YouTube, SoundCloud, Spotify)
- [ ] Fase 4: Eventos
- [ ] Fase 5: Feed general + busqueda con filtros
- [ ] Fase 6: Panel admin + estadisticas
- [ ] Fase 7: Deploy Netlify + Render + SEO
