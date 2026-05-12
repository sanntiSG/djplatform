import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getTypes,
  getPreferences,
  updatePreferences,
  getInbox,
  markRead,
  markAllRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notificationController.js'

const router = Router()

router.get('/types', requireAuth, getTypes)
router.get('/preferences', requireAuth, getPreferences)
router.patch('/preferences', requireAuth, updatePreferences)

router.get('/inbox', requireAuth, getInbox)
router.get('/inbox/unread-count', requireAuth, getUnreadCount)
router.patch('/inbox/read-all', requireAuth, markAllRead)
router.patch('/inbox/:id/read', requireAuth, markRead)
router.delete('/inbox/:id', requireAuth, deleteNotification)

export default router
