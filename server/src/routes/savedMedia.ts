import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { toggleSave, listSaved, removeSaved } from '../controllers/savedMediaController.js'

const router = Router()

router.use(requireAuth)

router.get('/', listSaved)
router.post('/:profileId/:mediaId', toggleSave)
router.delete('/:profileId/:mediaId', removeSaved)

export default router
