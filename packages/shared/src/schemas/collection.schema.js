const { z } = require('zod');

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color').optional().default('#6C5CE7'),
  icon: z.string().max(10).optional().default('📁'),
  visibility: z.enum(['private', 'team', 'public']).default('private'),
});

const updateCollectionSchema = createCollectionSchema.partial();

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

module.exports = {
  createCollectionSchema,
  updateCollectionSchema,
  addMemberSchema,
  updateMemberRoleSchema,
};
