const mongoose = require('mongoose');
const { Schema } = mongoose;

const inviteLinkSchema = new Schema({
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'viewer' },
  token: { type: String, required: true, unique: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

inviteLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('InviteLink', inviteLinkSchema);
