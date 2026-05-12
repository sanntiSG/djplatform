import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  dismissAsk,
} from '../controllers/pushController.js'

const router = Router()

router.get('/vapid-public-key', getVapidPublicKey)
router.post('/subscribe', requireAuth, subscribePush)
router.post('/unsubscribe', requireAuth, unsubscribePush)
router.post('/ask-dismissed', requireAuth, dismissAsk)

export default router
