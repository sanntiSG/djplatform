import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { request, confirm, reject, listForProfile, listPending, listTrending } from '../controllers/collaborationController.js'

const router = Router()

router.post('/', requireAuth, request)
router.get('/trending', listTrending)
router.get('/pending', requireAuth, listPending)
router.post('/:id/confirm', requireAuth, confirm)
router.delete('/:id', requireAuth, reject)
router.get('/profile/:profileId', optionalAuth, listForProfile)

export default router
