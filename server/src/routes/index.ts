import { Router } from 'express'
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

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
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
router.use('/', sitemapRouter)

export default router
