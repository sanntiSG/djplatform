import { Router } from 'express'
import mongoose from 'mongoose'
import authRouter from './auth.js'
import profileRouter from './profile.js'
import eventRouter from './event.js'
import mediaRouter from './media.js'
import uploadRouter from './upload.js'
import catalogRouter from './catalog.js'
import adminRouter from './admin.js'
import moderationRouter from './moderation.js'
import locationsRouter from './locations.js'
import sitemapRouter from './sitemap.js'
import pushRouter from './push.js'
import notificationsRouter from './notifications.js'
import conversationsRouter from './conversations.js'
import activityRouter from './activity.js'
import opportunitiesRouter from './opportunities.js'
import collaborationsRouter from './collaborations.js'
import artistImagesRouter from './artistImages.js'
import savedMediaRouter from './savedMedia.js'
import feedRouter from './feed.js'

const router = Router()

router.get('/health', (_req, res) => {
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbReady = mongoose.connection.readyState === 1
  const status = dbReady ? 200 : 503
  res.status(status).json({
    ok: dbReady,
    db: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

router.use('/auth', authRouter)
router.use('/profiles', profileRouter)
router.use('/events', eventRouter)
router.use('/media', mediaRouter)
router.use('/uploads', uploadRouter)
router.use('/catalogs', catalogRouter)
router.use('/admin', adminRouter)
router.use('/moderation', moderationRouter)
router.use('/locations', locationsRouter)
router.use('/push', pushRouter)
router.use('/notifications', notificationsRouter)
router.use('/conversations', conversationsRouter)
router.use('/activity', activityRouter)
router.use('/opportunities', opportunitiesRouter)
router.use('/collaborations', collaborationsRouter)
router.use('/artist-images', artistImagesRouter)
router.use('/users/me/saved-media', savedMediaRouter)
router.use('/feed', feedRouter)
router.use('/', sitemapRouter)

export default router
