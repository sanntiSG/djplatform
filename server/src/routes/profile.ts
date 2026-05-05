import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { create, getMe, updateMe, getById, list } from '../controllers/profileController.js'
import { listByProfile } from '../controllers/eventController.js'
import {
  getProfileSocial,
  follow,
  likeProfile,
  getProfileComments,
  postProfileComment,
  deleteProfileComment,
} from '../controllers/profileSocialController.js'

const router = Router()

router.get('/', list)
router.post('/', requireAuth, create)
router.get('/me', requireAuth, getMe)
router.patch('/me', requireAuth, updateMe)
router.get('/:id', getById)
router.get('/:id/events', listByProfile)

// Social
router.get('/:id/social', optionalAuth, getProfileSocial)
router.post('/:id/follow', requireAuth, follow)
router.post('/:id/like', requireAuth, likeProfile)
router.get('/:id/comments', optionalAuth, getProfileComments)
router.post('/:id/comments', requireAuth, postProfileComment)
router.delete('/:id/comments/:commentId', requireAuth, deleteProfileComment)

export default router
