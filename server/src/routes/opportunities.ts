import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { list, forYou, getById, create, update, remove, apply, acceptCollab, cancelApply, myApplications } from '../controllers/opportunityController.js'

const router = Router()

router.get('/for-you', requireAuth, forYou)
router.get('/me/applications', requireAuth, myApplications)
router.get('/', optionalAuth, list)
router.get('/:id', optionalAuth, getById)
router.post('/', requireAuth, create)
router.patch('/:id', requireAuth, update)
router.delete('/:id', requireAuth, remove)
router.post('/:id/apply', requireAuth, apply)
router.delete('/:id/apply', requireAuth, cancelApply)
router.post('/:id/accept-collab', requireAuth, acceptCollab)

export default router
