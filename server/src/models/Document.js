const mongoose = require('mongoose');
const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx', 'txt', 'csv', 'md'], required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    fileHash: { type: String, required: true, index: true },
    status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed', 'archived'], default: 'uploading' },
    processingError: { type: String, default: null },
    metadata: {
      pageCount: { type: Number, default: null },
      wordCount: { type: Number, default: null },
      author: { type: String, default: null },
      title: { type: String, default: null },
      language: { type: String, default: 'en' },
    },
    chunkCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

documentSchema.index({ collectionId: 1, status: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index(
  { fileName: 'text', 'metadata.title': 'text', tags: 'text' },
  { language_override: 'dummy_language_field' }
);

module.exports = mongoose.model('Document', documentSchema);
