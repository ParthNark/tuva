const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config');
const studentPersona = require('../../../shared/prompts/student-persona');

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function teach(lesson) {
  const prompt = `${studentPersona} Teach me: ${lesson}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function askQuestion(context) {
  const prompt = `${studentPersona} Based on: ${context} Ask one clarifying question.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function summarize(context) {
  const prompt = `${studentPersona} Summarize what you learned from: ${context} in bullet points.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { teach, askQuestion, summarize };