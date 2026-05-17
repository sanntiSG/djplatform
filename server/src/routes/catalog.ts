import { Router } from 'express'
import { listGenres, listEventTypes, listProfileTypes, listGenresByPopularity } from '../controllers/catalogController.js'

const router = Router()

router.get('/genres', listGenres)
router.get('/genres/by-popularity', listGenresByPopularity)
router.get('/event-types', listEventTypes)
router.get('/profile-types', listProfileTypes)

export default router
