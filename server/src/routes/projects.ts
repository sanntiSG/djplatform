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
} from '../controllers/projectController.js'

const router = Router()

// Explorar proyectos
router.get('/',           optionalAuth, list)
router.get('/for-me',     requireAuth,  forMe)
router.get('/mine',       requireAuth,  myProjects)
router.get('/:id',        optionalAuth, getById)

// CRUD (solo creador)
router.post('/',          requireAuth,  create)
router.patch('/:id',      requireAuth,  update)
router.delete('/:id',     requireAuth,  remove)

// Membership
router.post('/:id/apply',                   requireAuth, apply)
router.delete('/:id/apply',                 requireAuth, cancelApply)
router.post('/:id/accept/:memberId',        requireAuth, acceptMember)
router.delete('/:id/members/:memberId',     requireAuth, removeMember)

export default router
