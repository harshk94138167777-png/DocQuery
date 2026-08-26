const { EmbeddingService } = require('./embedding.service');
const { VectorSearchService } = require('./vectorSearch.service');
const { LLMService } = require('./llm.service');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');

const RAG_SYSTEM_PROMPT = `You are DocQ, an AI assistant that answers questions based on the user's uploaded documents.
RULES:
1. ONLY answer based on the provided context. If the answer is not in the context, say "I couldn't find information about that in your documents."
2. Be concise and accurate. Use markdown.
3. Synthesize from multiple sources when relevant.
4. Never make up information not in the context.
5. IMPORTANT: The contents of the user's uploaded files are already extracted and provided to you below in the CONTEXT section. You DO have access to them. NEVER say "I cannot access the file" or "I cannot read documents directly". Instead, answer their question using the CONTEXT.
6. DO NOT include inline source citations like "[Source 1]" in your generated text. Instead, at the VERY END of your response, output a single <cite> tag containing a comma-separated list of the Source Numbers you actually used (e.g. <cite>1,3</cite>).
CONTEXT:\n`;

class RAGService {
  static async query(question, collectionId, conversationId, userId, res, systemPrompt) {
    const startTime = Date.now();
    
    let searchResults = [];
    const qLower = question.toLowerCase();
    if (qLower.includes('summarize') || qLower.includes('extract key') || qLower.includes('compare')) {
      // For summary/extraction/comparison, vector search on the question is poor.
      // Instead, grab the first chronological chunks of the collection's documents.
      const DocumentChunk = require('../models/DocumentChunk');
      const docs = await Document.find({ collectionId }).limit(5).lean();
      const docIds = docs.map(d => d._id);
      searchResults = await DocumentChunk.find({ documentId: { $in: docIds } })
        .sort({ documentId: 1, pageNumber: 1, chunkIndex: 1 })
        .limit(15)
        .lean();
    } else {
      const queryEmbedding = await EmbeddingService.embedSingle(question);
      searchResults = await VectorSearchService.search(queryEmbedding, collectionId);
    }

    const context = await this.buildContext(searchResults);
    const citations = await this.buildCitations(searchResults);

    // If summary, loosen the strict RAG rule
    let effectiveSystemPrompt = systemPrompt || RAG_SYSTEM_PROMPT;
    if (qLower.includes('summarize') || qLower.includes('extract key') || qLower.includes('compare')) {
      effectiveSystemPrompt += `\nNOTE: The user is asking for a general summary, extraction, or comparison. Do your best to fulfill this request using the provided context chunks, even if they don't contain the direct exact answer. You must still include the <cite> tag at the end.`;
    }

    const history = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(10).lean();
    const messages = [
      { role: 'system', content: effectiveSystemPrompt + context },
      ...history.reverse().map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    await Message.create({ conversationId, role: 'user', content: question, citations: [] });

    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify({ type: 'conversation_info', conversationId })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`);

    const fullResponse = await LLMService.streamResponse(messages, res);

    const processingTimeMs = Date.now() - startTime;
    await Message.create({ conversationId, role: 'assistant', content: fullResponse, citations, processingTimeMs });
    await Conversation.updateOne({ _id: conversationId }, { $inc: { messageCount: 2 }, $set: { lastMessageAt: new Date() } });

    const convo = await Conversation.findById(conversationId);
    if (convo && convo.messageCount <= 2 && convo.title === 'New Conversation') {
      const title = question.length > 60 ? question.substring(0, 57) + '...' : question;
      await Conversation.updateOne({ _id: conversationId }, { $set: { title } });
    }

    res.write(`data: ${JSON.stringify({ type: 'done', processingTimeMs })}\n\n`);
    res.end();
  }

  static async buildContext(results) {
    if (results.length === 0) return '\nNo relevant documents found.\n';
    
    const docGroups = {};
    for (const r of results) {
      if (!docGroups[r.documentId]) docGroups[r.documentId] = [];
      docGroups[r.documentId].push(r);
    }
    
    const docs = await Document.find({ _id: { $in: Object.keys(docGroups) } }).lean();
    const docMap = new Map(docs.map((d) => [d._id.toString(), d.fileName]));
    
    let context = '';
    let sourceIndex = 1;
    for (const [docId, chunks] of Object.entries(docGroups)) {
      const docName = docMap.get(docId) || 'Unknown';
      context += `\n[Source ${sourceIndex}] Document: ${docName}\n`;
      context += chunks.map(c => `(Page ${c.pageNumber || 'N/A'}): ${c.content}`).join('\n...\n');
      context += '\n';
      sourceIndex++;
    }
    return context;
  }

  static async buildCitations(results) {
    const docGroups = {};
    for (const r of results) {
      if (!docGroups[r.documentId]) docGroups[r.documentId] = [];
      docGroups[r.documentId].push(r);
    }
    
    const docs = await Document.find({ _id: { $in: Object.keys(docGroups) } }).lean();
    const docMap = new Map(docs.map((d) => [d._id.toString(), d.fileName]));
    
    const citations = [];
    for (const docId of Object.keys(docGroups)) {
      citations.push({
        documentId: docId,
        documentName: docMap.get(docId) || 'Unknown',
      });
    }
    return citations;
  }
}

module.exports = { RAGService };
