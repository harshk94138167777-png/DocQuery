const { env } = require('../config/env');

class ChunkingService {
  static chunk(text, options = {}) {
    const chunkSize = options.chunkSize || env.CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap || env.CHUNK_OVERLAP;
    const chunks = [];
    if (!text || text.trim().length === 0) return chunks;

    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let currentOffset = 0;
    let chunkStartOffset = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) { currentOffset += paragraph.length + 2; continue; }
      const estimatedTokens = this.estimateTokens(currentChunk + '\n\n' + trimmed);

      if (estimatedTokens > chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(currentChunk.trim(), chunkIndex, chunkStartOffset));
        chunkIndex++;
        const words = currentChunk.trim().split(/\s+/);
        const overlapWords = words.slice(-chunkOverlap);
        currentChunk = overlapWords.join(' ') + '\n\n' + trimmed;
        chunkStartOffset = currentOffset - overlapWords.join(' ').length;
      } else {
        if (currentChunk.length === 0) chunkStartOffset = currentOffset;
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
      currentOffset += paragraph.length + 2;
    }
    if (currentChunk.trim().length > 0) chunks.push(this.createChunk(currentChunk.trim(), chunkIndex, chunkStartOffset));
    return chunks;
  }

  static createChunk(content, index, startOffset) {
    const isTable = /\|.*\|.*\|/.test(content) || /\t.*\t/.test(content);
    const isCode = /```/.test(content) || /^\s{4,}\S/m.test(content);
    const sectionMatch = content.match(/^#{1,6}\s+(.+)/m);
    return {
      content, chunkIndex: index, startOffset, endOffset: startOffset + content.length,
      tokenCount: this.estimateTokens(content), pageNumber: null,
      metadata: { section: sectionMatch ? sectionMatch[1] : null, isTable, isCode },
    };
  }

  static estimateTokens(text) { return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3); }
}

module.exports = { ChunkingService };
