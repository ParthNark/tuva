const elevenlabs = require('elevenlabs');
const { elevenlabsApiKey, elevenlabsVoiceId } = require('../config');

async function speak(text) {
  const audioStream = await elevenlabs.generate({
    voice: elevenlabsVoiceId,
    text: text,
    model_id: 'eleven_monolingual_v1',
    apiKey: elevenlabsApiKey,
  });
  return audioStream;
}

module.exports = { speak };