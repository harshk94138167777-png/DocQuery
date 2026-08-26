const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { ParsingService } = require('../services/parsing.service');
const { ChunkingService } = require('../services/chunking.service');
const { EmbeddingService } = require('../services/embedding.service');
const { DocumentService } = require('../services/document.service');
const DocumentChunk = require('../models/DocumentChunk');
const { logger } = require('../utils/logger');

const createDocumentProcessorWorker = () => {
  const worker = new Worker(
    'document-processing',
    async (job) => {
      const { documentId, collectionId, filePath, fileType, chunkSize, chunkOverlap } = job.data;
      try {
        logger.info({ documentId }, 'Starting document processing');
        await DocumentService.updateStatus(documentId, 'processing');

        await job.updateProgress(10);
        const parsed = await ParsingService.parse(filePath, fileType);

        await job.updateProgress(30);
        const chunks = ChunkingService.chunk(parsed.text, { chunkSize, chunkOverlap });

        await job.updateProgress(50);
        const batchSize = 10;
        const allEmbeddings = [];
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const embeddings = await EmbeddingService.embed(batch.map((c) => c.content));
          allEmbeddings.push(...embeddings);
          await job.updateProgress(50 + Math.floor((i / chunks.length) * 40));
        }

        await job.updateProgress(90);
        const chunkDocs = chunks.map((chunk, i) => ({
          documentId, collectionId, chunkIndex: chunk.chunkIndex, content: chunk.content,
          pageNumber: chunk.pageNumber, startOffset: chunk.startOffset, endOffset: chunk.endOffset,
          tokenCount: chunk.tokenCount, embedding: allEmbeddings[i], metadata: chunk.metadata,
        }));
        await DocumentChunk.insertMany(chunkDocs);

        await DocumentService.updateMetadata(documentId, { pageCount: parsed.pageCount, wordCount: parsed.wordCount, author: parsed.metadata.author, title: parsed.metadata.title, language: 'en' }, chunks.length);
        await job.updateProgress(100);
        logger.info({ documentId, chunkCount: chunks.length }, 'Document processing complete');
      } catch (error) {
        logger.error({ documentId, error: error.message }, 'Document processing failed');
        await DocumentService.updateStatus(documentId, 'failed', error.message);
        throw error;
      }
    },
    { connection: getRedis(), concurrency: 2, limiter: { max: 5, duration: 60000 } }
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Processing job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, error: err.message }, 'Processing job failed'));
  return worker;
};

module.exports = { createDocumentProcessorWorker };
