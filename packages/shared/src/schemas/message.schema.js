const { z } = require('zod');

const sendMessageSchema = z.object({
  conversationId: z.string().length(24, 'Invalid conversation ID').optional(),
  collectionId: z.string().length(24, 'Invalid collection ID'),
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long').trim(),
  templateId: z.string().length(24).optional(),
});

const createConversationSchema = z.object({
  collectionId: z.string().length(24, 'Invalid collection ID'),
  title: z.string().min(1).max(200).trim().optional(),
  systemPrompt: z.string().max(5000).optional(),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const messageFeedbackSchema = z.object({
  rating: z.enum(['up', 'down']),
  comment: z.string().max(1000).optional(),
});

const conversationQuerySchema = z.object({
  search: z.string().max(200).optional(),
  isPinned: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'title']).optional().default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const messageHistorySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

module.exports = {
  sendMessageSchema,
  createConversationSchema,
  updateConversationSchema,
  messageFeedbackSchema,
  conversationQuerySchema,
  messageHistorySchema,
};
