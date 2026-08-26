const ROLES = {
  GLOBAL: { USER: 'user', ADMIN: 'admin' },
  COLLECTION: { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member', VIEWER: 'viewer' },
};

const ROLE_HIERARCHY = { owner: 4, admin: 3, member: 2, viewer: 1 };

const canWrite = (role) => (ROLE_HIERARCHY[role] || 0) >= ROLE_HIERARCHY.member;
const canManage = (role) => (ROLE_HIERARCHY[role] || 0) >= ROLE_HIERARCHY.admin;
const canDelete = (role) => (ROLE_HIERARCHY[role] || 0) >= ROLE_HIERARCHY.owner;

const LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 50,
  MAX_TAGS_PER_DOCUMENT: 20,
  MAX_MESSAGE_LENGTH: 10000,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  DEFAULT_CHUNK_SIZE: 512,
  DEFAULT_CHUNK_OVERLAP: 50,
  MAX_DOCUMENTS_PER_COLLECTION: 500,
  MAX_MEMBERS_PER_COLLECTION: 50,
  RATE_LIMIT_AUTH: { windowMs: 15 * 60 * 1000, max: 50 },
  RATE_LIMIT_API: { windowMs: 60 * 1000, max: 100 },
  RATE_LIMIT_CHAT: { windowMs: 60 * 1000, max: 20 },
  RATE_LIMIT_UPLOAD: { windowMs: 60 * 1000, max: 10 },
  RATE_LIMIT_EXPORT: { windowMs: 60 * 1000, max: 5 },
  SESSION_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  RESET_TOKEN_TTL_MS: 30 * 60 * 1000,
  VERIFICATION_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
  VECTOR_SEARCH_TOP_K: 8,
  VECTOR_SEARCH_NUM_CANDIDATES: 100,
};

const DOCUMENT_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  ARCHIVED: 'archived',
};

const MIME_TO_FILE_TYPE = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/markdown': 'md',
};

const LLM_PROVIDERS = { GEMINI: 'gemini', GROQ: 'groq', OPENAI: 'openai' };
const EMBEDDING_PROVIDERS = { GEMINI: 'gemini', OPENAI: 'openai' };

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  canWrite,
  canManage,
  canDelete,
  LIMITS,
  DOCUMENT_STATUS,
  MIME_TO_FILE_TYPE,
  LLM_PROVIDERS,
  EMBEDDING_PROVIDERS,
};
