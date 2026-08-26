const crypto = require('crypto');
const fs = require('fs');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Collection = require('../models/Collection');
const { MIME_TO_FILE_TYPE } = require('@docq/shared');
const { buildCursorQuery, encodeCursor } = require('../utils/pagination');

class DocumentService {
  static async create(file, collectionId, uploadedBy, tags = []) {
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileType = MIME_TO_FILE_TYPE[file.mimetype] || 'txt';
    const document = await Document.create({ collectionId, uploadedBy, fileName: file.originalname, fileType, mimeType: file.mimetype, fileSize: file.size, filePath: file.path, fileHash, status: 'uploading', tags });
    await Collection.updateOne({ _id: collectionId }, { $inc: { documentCount: 1 } });
    return document.toObject();
  }

  static async getById(documentId) { return Document.findOne({ _id: documentId, deletedAt: null }).lean(); }

  static async getByCollection(collectionId, options) {
    const baseQuery = { collectionId, deletedAt: null };
    if (options.status) baseQuery.status = options.status;
    if (options.fileType) baseQuery.fileType = options.fileType;
    if (options.search) baseQuery.$text = { $search: options.search };
    const { query, sort } = buildCursorQuery(baseQuery, options);
    const docs = await Document.find(query).sort(sort).limit(options.limit + 1).lean();
    const hasMore = docs.length > options.limit;
    const results = hasMore ? docs.slice(0, -1) : docs;
    const nextCursor = hasMore && results.length > 0 ? encodeCursor(results[results.length - 1][options.sortBy], results[results.length - 1]._id.toString()) : null;
    return { documents: results, cursor: nextCursor, hasMore };
  }

  static async updateStatus(documentId, status, error) {
    const update = { status };
    if (error) update.processingError = error;
    await Document.updateOne({ _id: documentId }, { $set: update });
  }

  static async updateMetadata(documentId, metadata, chunkCount) {
    await Document.updateOne({ _id: documentId }, { $set: { metadata, chunkCount, status: 'ready' } });
  }

  static async softDelete(documentId) {
    const doc = await Document.findById(documentId);
    if (doc) {
      await Document.updateOne({ _id: documentId }, { $set: { deletedAt: new Date() } });
      await DocumentChunk.deleteMany({ documentId });
      await Collection.updateOne({ _id: doc.collectionId }, { $inc: { documentCount: -1 } });
    }
  }
}

module.exports = { DocumentService };
