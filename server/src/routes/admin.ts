import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import {
  stats,
  listProfiles,
  setProfileVisibility,
  deleteProfile,
  listEvents,
  setEventVisibility,
  deleteEvent,
  listUsers,
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  listProfileTypes,
  createProfileType,
  updateProfileType,
  deleteProfileType,
  dbStats,
  cleanupInactive,
  getSystem,
  updateSystem,
} from '../controllers/adminController.js'
import {
  listNotificationTypes,
  updateNotificationType,
  bulkUpdateNotificationTypes,
  getPushStatus,
  testPushAdmin,
} from '../controllers/adminNotificationController.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/stats', stats)
router.get('/profiles', listProfiles)
router.patch('/profiles/:id/visibility', setProfileVisibility)
router.delete('/profiles/:id', deleteProfile)
router.get('/events', listEvents)
router.patch('/events/:id/visibility', setEventVisibility)
router.delete('/events/:id', deleteEvent)
router.get('/users', listUsers)

router.get('/genres', listGenres)
router.post('/genres', createGenre)
router.patch('/genres/:id', updateGenre)
router.delete('/genres/:id', deleteGenre)

router.get('/profile-types', listProfileTypes)
router.post('/profile-types', createProfileType)
router.patch('/profile-types/:id', updateProfileType)
router.delete('/profile-types/:id', deleteProfileType)

router.get('/db-stats', dbStats)
router.post('/cleanup/inactive-profiles', cleanupInactive)

router.get('/notification-types', listNotificationTypes)
router.patch('/notification-types/:key', updateNotificationType)
router.post('/notification-types/bulk', bulkUpdateNotificationTypes)

router.get('/push-status', getPushStatus)
router.post('/push-test', testPushAdmin)

router.get('/system', getSystem)
router.patch('/system', updateSystem)

export default router
