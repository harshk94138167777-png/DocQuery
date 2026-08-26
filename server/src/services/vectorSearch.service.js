const DocumentChunk = require('../models/DocumentChunk');
const { LIMITS } = require('@docq/shared');
const { logger } = require('../utils/logger');

class VectorSearchService {
  static async search(queryEmbedding, collectionId, topK = LIMITS.VECTOR_SEARCH_TOP_K) {
    try {
      const results = await DocumentChunk.aggregate([
        { $vectorSearch: { index: 'vector_index', path: 'embedding', queryVector: queryEmbedding, numCandidates: LIMITS.VECTOR_SEARCH_NUM_CANDIDATES, limit: topK, filter: { collectionId: { $eq: collectionId } } } },
        { $project: { _id: 1, documentId: 1, content: 1, pageNumber: 1, chunkIndex: 1, metadata: 1, score: { $meta: 'vectorSearchScore' } } },
      ]);
      return results.map((r) => ({ chunkId: r._id.toString(), documentId: r.documentId.toString(), content: r.content, pageNumber: r.pageNumber, chunkIndex: r.chunkIndex, score: r.score, metadata: r.metadata }));
    } catch (error) {
      if (error.codeName === 'InvalidPipelineOperator' || error.message?.includes('vectorSearch')) {
        logger.warn('Atlas Vector Search not available, using fallback cosine similarity');
        return this.fallbackSearch(queryEmbedding, collectionId, topK);
      }
      throw error;
    }
  }

  static async fallbackSearch(queryEmbedding, collectionId, topK) {
    const chunks = await DocumentChunk.find({ collectionId }).lean();
    const scored = chunks.map((chunk) => ({ ...chunk, score: this.cosineSimilarity(queryEmbedding, chunk.embedding) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((r) => ({ chunkId: r._id.toString(), documentId: r.documentId.toString(), content: r.content, pageNumber: r.pageNumber, chunkIndex: r.chunkIndex, score: r.score, metadata: r.metadata }));
  }

  static cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }
}

module.exports = { VectorSearchService };
