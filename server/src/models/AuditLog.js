const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['create', 'update', 'delete', 'query', 'export', 'login', 'logout', 'invite'], required: true },
  entityType: { type: String, enum: ['document', 'collection', 'conversation', 'user', 'annotation'], required: true },
  entityId: { type: String, required: true },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', default: null },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ collectionId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
