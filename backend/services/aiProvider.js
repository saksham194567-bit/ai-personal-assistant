const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel(options = {}) {
  const provider = (process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
  if (provider !== 'gemini') {
    throw new Error(`Unsupported AI_PROVIDER "${provider}". Supported provider: gemini.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('AI provider is not configured. Add GEMINI_API_KEY to backend/.env.');
    error.status = 503;
    throw error;
  }

  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    systemInstruction: options.systemInstruction,
    generationConfig: options.json
      ? { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 4096 }
      : { temperature: 0.7, maxOutputTokens: 2048 },
  });
}

function toPublicError(error) {
  if (error.status) return error;
  const publicError = new Error('The AI provider could not complete the request. Check your provider configuration or try again shortly.');
  publicError.status = 502;
  return publicError;
}

async function generateText(prompt, options = {}) {
  try {
    const model = getModel(options);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) throw new Error('The AI provider returned an empty response.');
    return text;
  } catch (error) {
    throw toPublicError(error);
  }
}

async function generateJson(prompt, options = {}) {
  const response = await generateText(prompt, { ...options, json: true });
  try {
    return JSON.parse(response);
  } catch (_) {
    const error = new Error('The AI provider returned an invalid structured response. Please try again.');
    error.status = 502;
    throw error;
  }
}

module.exports = { generateText, generateJson };
