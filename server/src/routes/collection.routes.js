const { Router } = require('express');
const { CollectionService } = require('../services/collection.service');
const { authenticate, requireEmailVerified } = require('../middleware/auth');
const { requireCollectionRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createCollectionSchema, updateCollectionSchema, addMemberSchema, updateMemberRoleSchema } = require('@docq/shared');
const { sendSuccess, sendError } = require('../utils/response');
const User = require('../models/User');
const { EmailService } = require('../services/email.service');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => { try { const collections = await CollectionService.getUserCollections(req.user._id); sendSuccess(res, collections); } catch (error) { next(error); } });

router.post('/', validate(createCollectionSchema), auditLog('create', 'collection'), async (req, res, next) => {
  try { const collection = await CollectionService.create(req.body, req.user._id); sendSuccess(res, collection, 201); } catch (error) { next(error); }
});

router.get('/invitations/pending', async (req, res, next) => {
  try { const invites = await CollectionService.getPendingInvitations(req.user._id); sendSuccess(res, invites); } catch (error) { next(error); }
});

router.post('/:collectionId/invitations/accept', async (req, res, next) => {
  try { await CollectionService.acceptInvitation(req.params.collectionId, req.user._id); sendSuccess(res, { message: 'Invitation accepted' }); } catch (error) { next(error); }
});

router.post('/:collectionId/invitations/reject', async (req, res, next) => {
  try { await CollectionService.rejectInvitation(req.params.collectionId, req.user._id); sendSuccess(res, { message: 'Invitation rejected' }); } catch (error) { next(error); }
});

router.post('/join/:token', async (req, res, next) => {
  try {
    const InviteLink = require('../models/InviteLink');
    const link = await InviteLink.findOne({ token: req.params.token, expiresAt: { $gt: new Date() } });
    if (!link) { sendError(res, 400, 'INVALID_TOKEN', 'This invite link is invalid or has expired.'); return; }
    
    // Add member as 'accepted' directly since they clicked the link
    const existing = await require('../models/CollectionMember').findOne({ collectionId: link.collectionId, userId: req.user._id });
    if (existing) {
      sendSuccess(res, { message: 'Already a member', collectionId: link.collectionId });
      return;
    }
    
    await require('../models/CollectionMember').create({ 
      collectionId: link.collectionId, userId: req.user._id, role: link.role, invitedBy: link.createdBy, status: 'accepted' 
    });
    await require('../models/Collection').updateOne({ _id: link.collectionId }, { $inc: { memberCount: 1 } });
    
    sendSuccess(res, { message: 'Joined successfully', collectionId: link.collectionId });
  } catch (error) { next(error); }
});

router.post('/:collectionId/invite-links', requireCollectionRole('admin', 'owner'), async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const InviteLink = require('../models/InviteLink');
    const token = crypto.randomBytes(32).toString('hex');
    const role = req.body.role || 'viewer';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await InviteLink.create({ collectionId: req.params.collectionId, role, token, createdBy: req.user._id, expiresAt });
    
    const url = `${require('../config/env').env.CLIENT_URL}/join/${token}`;
    sendSuccess(res, { url, expiresAt });
  } catch (error) { next(error); }
});

router.get('/:collectionId', requireCollectionRole('viewer', 'member', 'admin', 'owner'), async (req, res, next) => {
  try { const c = await CollectionService.getById(req.params.collectionId); if (!c) { sendError(res, 404, 'NOT_FOUND', 'Collection not found'); return; } sendSuccess(res, c); } catch (error) { next(error); }
});

router.patch('/:collectionId', requireCollectionRole('admin', 'owner'), validate(updateCollectionSchema), auditLog('update', 'collection'), async (req, res, next) => {
  try { const c = await CollectionService.update(req.params.collectionId, req.body); sendSuccess(res, c); } catch (error) { next(error); }
});

router.delete('/:collectionId', requireCollectionRole('owner'), auditLog('delete', 'collection'), async (req, res, next) => {
  try { await CollectionService.softDelete(req.params.collectionId); sendSuccess(res, { message: 'Collection deleted' }); } catch (error) { next(error); }
});

router.get('/:collectionId/members', requireCollectionRole('viewer', 'member', 'admin', 'owner'), async (req, res, next) => {
  try { const members = await CollectionService.getMembers(req.params.collectionId); sendSuccess(res, members); } catch (error) { next(error); }
});

router.post('/:collectionId/members', requireCollectionRole('admin', 'owner'), validate(addMemberSchema), auditLog('invite', 'collection'), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) { sendError(res, 404, 'USER_NOT_FOUND', 'No user found with that email'); return; }
    await CollectionService.addMember(req.params.collectionId, user._id.toString(), req.body.role, req.user._id);
    const collection = await CollectionService.getById(req.params.collectionId);
    await EmailService.sendCollectionInviteEmail(req.body.email, req.user.displayName, collection?.name || 'Unknown');
    sendSuccess(res, { message: 'Member added' }, 201);
  } catch (error) { next(error); }
});

router.patch('/:collectionId/members/:userId', requireCollectionRole('admin', 'owner'), validate(updateMemberRoleSchema), async (req, res, next) => {
  try { await CollectionService.updateMemberRole(req.params.collectionId, req.params.userId, req.body.role); sendSuccess(res, { message: 'Role updated' }); } catch (error) { next(error); }
});

router.delete('/:collectionId/members/:userId', requireCollectionRole('admin', 'owner'), async (req, res, next) => {
  try { await CollectionService.removeMember(req.params.collectionId, req.params.userId); sendSuccess(res, { message: 'Member removed' }); } catch (error) { next(error); }
});

module.exports = router;
