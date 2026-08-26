const mongoose = require('mongoose');
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Conversation', trim: true, maxlength: 200 },
    parentConversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    branchPointMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    model: { type: String, default: 'gemini-2.0-flash' },
    systemPrompt: { type: String, default: null },
    messageCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ collectionId: 1, userId: 1 });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
