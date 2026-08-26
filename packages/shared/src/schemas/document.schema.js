const { z } = require('zod');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv', '.md'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const documentQuerySchema = z.object({
  status: z.enum(['uploading', 'processing', 'ready', 'failed', 'archived']).optional(),
  fileType: z.enum(['pdf', 'docx', 'txt', 'csv', 'md']).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'fileName', 'fileSize']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

module.exports = {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  documentQuerySchema,
};
