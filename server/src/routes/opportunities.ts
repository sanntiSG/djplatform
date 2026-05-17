import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { list, getById, create, update, remove, apply, acceptCollab } from '../controllers/opportunityController.js'

const createLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  validate: false,
  message: { error: 'Limite de 3 oportunidades por dia alcanzado.' },
})

const router = Router()

router.get('/', optionalAuth, list)
router.get('/:id', optionalAuth, getById)
router.post('/', requireAuth, createLimiter, create)
router.patch('/:id', requireAuth, update)
router.delete('/:id', requireAuth, remove)
router.post('/:id/apply', requireAuth, apply)
router.post('/:id/accept-collab', requireAuth, acceptCollab)

export default router
