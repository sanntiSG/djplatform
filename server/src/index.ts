import 'dotenv/config'
import http from 'http'
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
import { initIO } from './realtime/io.js'
import { startTrendingCron } from './jobs/trendingCron.js'

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

const app = express()

app.set('trust proxy', 1)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://i.scdn.co', 'https://i1.sndcdn.com', 'https://i2.sndcdn.com', 'https://i3.sndcdn.com'],
        mediaSrc: ["'self'"],
        frameSrc: [
          'https://open.spotify.com',
          'https://w.soundcloud.com',
          'https://www.youtube.com',
          'https://youtube.com',
        ],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
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

const httpServer = http.createServer(app)
initIO(httpServer)

connectDB()
  .then(() => {
    startTrendingCron()
    httpServer.listen(Number(env.PORT), () => {
      logger.info(`Servidor corriendo en http://localhost:${env.PORT}`)
    })
  })
  .catch((err: unknown) => {
    logger.error('Fallo al conectar a MongoDB, arrancando igual', err)
    httpServer.listen(Number(env.PORT), () => {
      logger.info(`Servidor corriendo en http://localhost:${env.PORT} (sin DB)`)
    })
  })
