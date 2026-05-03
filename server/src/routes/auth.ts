import { Router } from 'express'
import { register, login, googleAuth, me, changePassword } from '../controllers/authController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/me', requireAuth, me)
router.post('/change-password', requireAuth, changePassword)

export default router
