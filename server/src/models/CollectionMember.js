const mongoose = require('mongoose');
const { Schema } = mongoose;

const memberSchema = new Schema({
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted' },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

memberSchema.index({ collectionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CollectionMember', memberSchema);
