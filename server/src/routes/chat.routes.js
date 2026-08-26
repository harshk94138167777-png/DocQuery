const { Router } = require('express');
const { RAGService } = require('../services/rag.service');
const { authenticate } = require('../middleware/auth');
const { requireCollectionRole } = require('../middleware/rbac');
const { chatLimiter } = require('../middleware/rateLimiter');
const { sendSuccess, sendError } = require('../utils/response');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = Router();
router.use(authenticate);

router.post('/:collectionId/query', requireCollectionRole('viewer', 'member', 'admin', 'owner'), chatLimiter, async (req, res, next) => {
  try {
    const { question, conversationId, systemPrompt } = req.body;
    if (!question) { sendError(res, 400, 'NO_QUESTION', 'Question is required'); return; }
    
    let convoId = conversationId;
    if (!convoId) {
      const convo = await Conversation.create({
        userId: req.user._id,
        collectionId: req.params.collectionId,
        title: 'New Conversation'
      });
      convoId = convo._id;
    }

    await RAGService.query(question, req.params.collectionId, convoId, req.user._id, res, systemPrompt);
  } catch (error) { next(error); }
});

router.get('/:collectionId/conversations', requireCollectionRole('viewer', 'member', 'admin', 'owner'), async (req, res, next) => {
  try {
    const convos = await Conversation.find({ collectionId: req.params.collectionId, userId: req.user._id, deletedAt: null }).sort({ updatedAt: -1 }).lean();
    sendSuccess(res, convos);
  } catch (error) { next(error); }
});

router.get('/:collectionId/conversations/:conversationId/messages', requireCollectionRole('viewer', 'member', 'admin', 'owner'), async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 }).lean();
    sendSuccess(res, messages);
  } catch (error) { next(error); }
});

module.exports = router;
