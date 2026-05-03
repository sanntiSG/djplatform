import { Router } from 'express'
import { listGenres, listEventTypes } from '../controllers/catalogController.js'

const router = Router()

router.get('/genres', listGenres)
router.get('/event-types', listEventTypes)

export default router
