const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const OpenAI = require('openai');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

let geminiClient = null, groqClient = null, openaiClient = null;
const getGemini = () => { if (!geminiClient) geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY); return geminiClient; };
const getGroq = () => { if (!groqClient) groqClient = new Groq({ apiKey: env.GROQ_API_KEY }); return groqClient; };
const getOpenAI = () => { if (!openaiClient) openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY }); return openaiClient; };

class LLMService {
  static async streamResponse(messages, res) {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        if (provider === 'gemini') return await this.streamGemini(messages, res);
        if (provider === 'groq') return await this.streamGroq(messages, res);
        if (provider === 'openai') return await this.streamOpenAI(messages, res);
      } catch (error) {
        if (error?.status === 429 || error?.code === 'rate_limit_exceeded') { logger.warn(`${provider} rate limited, trying next...`); continue; }
        throw error;
      }
    }
    throw new Error('All LLM providers exhausted');
  }

  static getProviderChain() {
    const chain = [env.LLM_PROVIDER];
    if (env.LLM_PROVIDER !== 'groq' && env.GROQ_API_KEY) chain.push('groq');
    if (env.LLM_PROVIDER !== 'openai' && env.OPENAI_API_KEY) chain.push('openai');
    if (env.LLM_PROVIDER !== 'gemini' && env.GEMINI_API_KEY) chain.push('gemini');
    return [...new Set(chain)];
  }

  static async streamGemini(messages, res) {
    const model = getGemini().getGenerativeModel({ model: 'gemini-2.0-flash' });
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');
    const chat = model.startChat({
      history: chatMessages.slice(0, -1).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      ...(systemMsg && { systemInstruction: { role: 'user', parts: [{ text: systemMsg.content }] } }),
    });
    const result = await chat.sendMessageStream(chatMessages[chatMessages.length - 1].content);
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) { fullResponse += text; res.write(`data: ${JSON.stringify({ content: text })}\n\n`); }
    }
    return fullResponse;
  }

  static async streamGroq(messages, res) {
    const stream = await getGroq().chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: messages.map((m) => ({ role: m.role, content: m.content })), stream: true, max_tokens: 4096 });
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) { fullResponse += content; res.write(`data: ${JSON.stringify({ content })}\n\n`); }
    }
    return fullResponse;
  }

  static async streamOpenAI(messages, res) {
    const stream = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: messages.map((m) => ({ role: m.role, content: m.content })), stream: true, max_tokens: 4096 });
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) { fullResponse += content; res.write(`data: ${JSON.stringify({ content })}\n\n`); }
    }
    return fullResponse;
  }
}

module.exports = { LLMService };
