const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  citations: [
    {
      chunkId: { type: Schema.Types.ObjectId, ref: 'DocumentChunk' },
      documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
      documentName: String,
      pageNumber: Number,
      snippet: String,
      relevanceScore: Number,
    },
  ],
  feedback: {
    rating: { type: String, enum: ['up', 'down', null], default: null },
    comment: { type: String, default: null },
  },
  tokenUsage: {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  processingTimeMs: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
