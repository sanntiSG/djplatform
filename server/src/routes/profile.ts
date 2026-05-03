import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { create, getMe, updateMe, getById, list } from '../controllers/profileController.js'
import { listByProfile } from '../controllers/eventController.js'

const router = Router()

router.get('/', list)
router.post('/', requireAuth, create)
router.get('/me', requireAuth, getMe)
router.patch('/me', requireAuth, updateMe)
router.get('/:id', getById)
router.get('/:id/events', listByProfile)

export default router
