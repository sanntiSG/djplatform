import { Router } from 'express'
import { listGenres, listEventTypes, listProfileTypes } from '../controllers/catalogController.js'

const router = Router()

router.get('/genres', listGenres)
router.get('/event-types', listEventTypes)
router.get('/profile-types', listProfileTypes)

export default router
