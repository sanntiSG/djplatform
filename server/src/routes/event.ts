import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { create, update, remove, getById, feed } from '../controllers/eventController.js'
import {
  getStats,
  like,
  attend,
  getComments,
  postComment,
  removeComment,
} from '../controllers/socialController.js'

const router = Router()

router.get('/', feed)
router.post('/', requireAuth, create)
router.get('/:id', getById)
router.patch('/:id', requireAuth, update)
router.delete('/:id', requireAuth, remove)

router.get('/:id/social', optionalAuth, getStats)
router.post('/:id/like', requireAuth, like)
router.post('/:id/attend', requireAuth, attend)
router.get('/:id/comments', getComments)
router.post('/:id/comments', requireAuth, postComment)
router.delete('/:id/comments/:commentId', requireAuth, removeComment)

export default router
