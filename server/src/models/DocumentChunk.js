const mongoose = require('mongoose');
const { Schema } = mongoose;

const chunkSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  pageNumber: { type: Number, default: null },
  startOffset: { type: Number, required: true },
  endOffset: { type: Number, required: true },
  tokenCount: { type: Number, required: true },
  embedding: { type: [Number], required: true },
  metadata: {
    section: { type: String, default: null },
    isTable: { type: Boolean, default: false },
    isCode: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

chunkSchema.index({ documentId: 1, chunkIndex: 1 });
chunkSchema.index({ collectionId: 1 });

module.exports = mongoose.model('DocumentChunk', chunkSchema);
