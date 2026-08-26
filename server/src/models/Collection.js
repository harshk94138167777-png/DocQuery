const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: null, maxlength: 500 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    color: { type: String, default: '#6C5CE7' },
    icon: { type: String, default: '📁' },
    memberCount: { type: Number, default: 1 },
    documentCount: { type: Number, default: 0 },
    visibility: { type: String, enum: ['private', 'team', 'public'], default: 'private' },
    settings: {
      defaultModel: { type: String, default: null },
      chunkSize: { type: Number, default: 512 },
      chunkOverlap: { type: Number, default: 50 },
      systemPrompt: { type: String, default: null },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

collectionSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
