const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['legal', 'research', 'finance', 'engineering', 'general'], required: true },
    description: { type: String, required: true },
    systemPrompt: { type: String, required: true },
    suggestedQuestions: [{ type: String }],
    icon: { type: String, default: '💬' },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatTemplateSchema.index({ category: 1 });
chatTemplateSchema.index({ isDefault: 1 });

module.exports = mongoose.model('ChatTemplate', chatTemplateSchema);
