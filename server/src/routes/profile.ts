import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { create, getMe, updateMe, updatePhotoCaption, updateMediaItemHandler, getById, list, topByFollowers } from '../controllers/profileController.js'
import { listByProfile } from '../controllers/eventController.js'
import {
  getProfileSocial,
  follow,
  likeProfile,
  getProfileComments,
  postProfileComment,
  patchProfileComment,
  likeProfileComment,
  deleteProfileComment,
} from '../controllers/profileSocialController.js'
import {
  getContentSocial,
  toggleLike as toggleContentLike,
  getComments as getContentComments,
  postComment as postContentComment,
  patchComment as patchContentComment,
  likeComment as likeContentComment,
  deleteComment as deleteContentComment,
} from '../controllers/contentSocialController.js'

const router = Router()

router.get('/', list)
router.get('/top', topByFollowers)
router.post('/', requireAuth, create)
router.get('/me', requireAuth, getMe)
router.patch('/me', requireAuth, updateMe)
router.patch('/me/photos/:photoId', requireAuth, updatePhotoCaption)
router.patch('/me/media/:mediaId', requireAuth, updateMediaItemHandler)
router.get('/:id', getById)
router.get('/:id/events', listByProfile)

// Profile social
router.get('/:id/social', optionalAuth, getProfileSocial)
router.post('/:id/follow', requireAuth, follow)
router.post('/:id/like', requireAuth, likeProfile)
router.get('/:id/comments', optionalAuth, getProfileComments)
router.post('/:id/comments', requireAuth, postProfileComment)
router.patch('/:id/comments/:commentId', requireAuth, patchProfileComment)
router.post('/:id/comments/:commentId/like', requireAuth, likeProfileComment)
router.delete('/:id/comments/:commentId', requireAuth, deleteProfileComment)

// Content social (per photo / media item)
router.get('/:profileId/content/social', optionalAuth, getContentSocial)
router.post('/:profileId/content/:kind/:targetId/like', requireAuth, toggleContentLike)
router.get('/:profileId/content/:kind/:targetId/comments', optionalAuth, getContentComments)
router.post('/:profileId/content/:kind/:targetId/comments', requireAuth, postContentComment)
router.patch('/:profileId/content/:kind/:targetId/comments/:commentId', requireAuth, patchContentComment)
router.post('/:profileId/content/:kind/:targetId/comments/:commentId/like', requireAuth, likeContentComment)
router.delete('/:profileId/content/:kind/:targetId/comments/:commentId', requireAuth, deleteContentComment)

export default router
