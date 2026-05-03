import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import router from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { generalLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js'
import { logger } from './utils/logger.js'

const app = express()

app.set('trust proxy', 1)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
  }),
)
app.use(compression())
const allowedOrigins = env.CLIENT_URL.split(',').map(o => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', generalLimiter, router)
app.use('/api/auth', authLimiter)
app.use('/api/uploads', uploadLimiter)
app.use('/api/media', uploadLimiter)
app.use(errorHandler)

connectDB()
  .then(() => {
    app.listen(Number(env.PORT), () => {
      logger.info(`Servidor corriendo en http://localhost:${env.PORT}`)
    })
  })
  .catch((err: unknown) => {
    logger.error('Fallo al conectar a MongoDB, arrancando igual', err)
    app.listen(Number(env.PORT), () => {
      logger.info(`Servidor corriendo en http://localhost:${env.PORT} (sin DB)`)
    })
  })
