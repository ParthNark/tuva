require('dotenv').config();

module.exports = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  auth0Domain: process.env.AUTH0_DOMAIN,
  auth0Audience: process.env.AUTH0_AUDIENCE,
  port: process.env.PORT || 5001,
  frontendUrl: process.env.FRONTEND_URL,
  backboardApiKey: process.env.BACKBOARD_API_KEY,
};