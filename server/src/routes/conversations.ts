import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  startConversation,
  listConversations,
  getConversationMessages,
  postMessage,
  readConversation,
  getUnreadTotal,
} from '../controllers/conversationController.js'

const router = Router()

router.use(requireAuth)

router.post('/', startConversation)
router.get('/', listConversations)
router.get('/unread-total', getUnreadTotal)
router.get('/:id/messages', getConversationMessages)
router.post('/:id/messages', postMessage)
router.patch('/:id/read', readConversation)

export default router
