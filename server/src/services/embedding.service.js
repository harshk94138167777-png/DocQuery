const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

let geminiClient = null;
let openaiClient = null;

const getGemini = () => { if (!geminiClient) geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY); return geminiClient; };
const getOpenAI = () => { if (!openaiClient) openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY }); return openaiClient; };

class EmbeddingService {
  static async embed(texts) {
    const provider = env.EMBEDDING_PROVIDER;
    try {
      return provider === 'gemini' ? await this.embedWithGemini(texts) : await this.embedWithOpenAI(texts);
    } catch (error) {
      if (error?.status === 429 && provider === 'gemini' && env.OPENAI_API_KEY) {
        logger.warn('Gemini rate limited, falling back to OpenAI for embeddings');
        return this.embedWithOpenAI(texts);
      }
      throw error;
    }
  }

  static async embedSingle(text) { const results = await this.embed([text]); return results[0]; }

  static async embedWithGemini(texts) {
    const client = getGemini();
    const model = client.getGenerativeModel({ model: 'text-embedding-004' });
    const results = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      results.push(result.embedding.values);
    }
    return results;
  }

  static async embedWithOpenAI(texts) {
    const client = getOpenAI();
    const response = await client.embeddings.create({ model: 'text-embedding-3-small', input: texts });
    return response.data.map((d) => d.embedding);
  }

  static getDimensions() { return env.EMBEDDING_PROVIDER === 'gemini' ? 768 : 1536; }
}

module.exports = { EmbeddingService };
