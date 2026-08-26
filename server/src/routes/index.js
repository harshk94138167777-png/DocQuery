const { Router } = require('express');
const authRoutes = require('./auth.routes');
const collectionRoutes = require('./collection.routes');
const documentRoutes = require('./document.routes');
const chatRoutes = require('./chat.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/collections', collectionRoutes);
router.use('/documents', documentRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
