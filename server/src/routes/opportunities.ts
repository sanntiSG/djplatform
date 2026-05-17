import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { list, getById, create, update, remove, apply, acceptCollab } from '../controllers/opportunityController.js'

const router = Router()

router.get('/', optionalAuth, list)
router.get('/:id', optionalAuth, getById)
router.post('/', requireAuth, create)
router.patch('/:id', requireAuth, update)
router.delete('/:id', requireAuth, remove)
router.post('/:id/apply', requireAuth, apply)
router.post('/:id/accept-collab', requireAuth, acceptCollab)

export default router
