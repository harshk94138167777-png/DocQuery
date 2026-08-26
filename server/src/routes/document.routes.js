const { Router } = require('express');
const { Queue } = require('bullmq');
const { DocumentService } = require('../services/document.service');
const { authenticate, requireEmailVerified } = require('../middleware/auth');
const { requireCollectionRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/upload');
const { auditLog } = require('../middleware/audit');
const { documentQuerySchema } = require('@docq/shared');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getRedis } = require('../config/redis');

const router = Router();
let documentQueue;
const getQueue = () => { if (!documentQueue) documentQueue = new Queue('document-processing', { connection: getRedis() }); return documentQueue; };

router.use(authenticate);

router.post('/upload/:collectionId', requireEmailVerified, requireCollectionRole('member', 'admin', 'owner'), uploadLimiter, upload.single('document'), auditLog('create', 'document'), async (req, res, next) => {
  try {
    if (!req.file) { sendError(res, 400, 'NO_FILE', 'No document file provided'); return; }
    const doc = await DocumentService.create(req.file, req.params.collectionId, req.user._id, req.body.tags ? JSON.parse(req.body.tags) : []);
    
    await getQueue().add('process', {
      documentId: doc._id,
      collectionId: req.params.collectionId,
      filePath: req.file.path,
      fileType: doc.fileType,
      chunkSize: req.body.chunkSize ? parseInt(req.body.chunkSize) : undefined,
      chunkOverlap: req.body.chunkOverlap ? parseInt(req.body.chunkOverlap) : undefined
    });
    
    sendSuccess(res, doc, 202);
  } catch (error) { next(error); }
});

router.get('/:collectionId', requireCollectionRole('viewer', 'member', 'admin', 'owner'), validate(documentQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await DocumentService.getByCollection(req.params.collectionId, req.query);
    sendPaginated(res, result.documents, result.cursor, result.hasMore);
  } catch (error) { next(error); }
});

router.get('/:collectionId/:documentId', requireCollectionRole('viewer', 'member', 'admin', 'owner'), async (req, res, next) => {
  try {
    const doc = await DocumentService.getById(req.params.documentId);
    if (!doc || doc.collectionId.toString() !== req.params.collectionId) { sendError(res, 404, 'NOT_FOUND', 'Document not found'); return; }
    sendSuccess(res, doc);
  } catch (error) { next(error); }
});

router.delete('/:collectionId/:documentId', requireCollectionRole('admin', 'owner'), auditLog('delete', 'document'), async (req, res, next) => {
  try {
    await DocumentService.softDelete(req.params.documentId);
    sendSuccess(res, { message: 'Document deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
