import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import {
  list,
  forMe,
  getById,
  create,
  update,
  remove,
  apply,
  cancelApply,
  acceptMember,
  removeMember,
  myProjects,
  publishProgress,
  deleteProgress,
  memberShareProgress,
  getProgressFeed,
  completeProject,
} from '../controllers/projectController.js'

const router = Router()

// Feed de avances (publica, no requiere auth)
router.get('/progress-feed',  optionalAuth, getProgressFeed)

// Explorar proyectos
router.get('/',           optionalAuth, list)
router.get('/for-me',     requireAuth,  forMe)
router.get('/mine',       requireAuth,  myProjects)
router.get('/:id',        optionalAuth, getById)

// CRUD (solo creador)
router.post('/',          requireAuth,  create)
router.patch('/:id',      requireAuth,  update)
router.delete('/:id',     requireAuth,  remove)

// Completion
router.post('/:id/complete', requireAuth, completeProject)

// Progress publishing
router.post('/:id/progress',                    requireAuth, publishProgress)
router.delete('/:id/progress/:postId',          requireAuth, deleteProgress)
router.post('/:id/progress/:postId/share',      requireAuth, memberShareProgress)

// Membership
router.post('/:id/apply',                   requireAuth, apply)
router.delete('/:id/apply',                 requireAuth, cancelApply)
router.post('/:id/accept/:memberId',        requireAuth, acceptMember)
router.delete('/:id/members/:memberId',     requireAuth, removeMember)

export default router
