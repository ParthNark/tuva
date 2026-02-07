# Tuva

An AI learning tutor that learns from you through your camera and voice. Show what you're making, describe your work, and get verbal feedback powered by Featherless.ai (Gemma) and ElevenLabs.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your API keys:

   ```bash
   cp .env.example .env.local
   ```

   - **FEATHERLESS_API_KEY**: Get from [featherless.ai](https://featherless.ai)
   - **ELEVENLABS_API_KEY**: Get from [elevenlabs.io](https://elevenlabs.io)
   - **ELEVENLABS_VOICE_ID**: Optional; defaults to Rachel. Browse voices at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). Allow camera and microphone access when prompted.

## How it works

- **Camera**: Captures what you're working on
- **Voice/Text**: Describe your work or ask questions (tap Listen for speech-to-text)
- **Get feedback**: Sends your frame + transcript to Gemma via Featherless.ai
- **Play feedback**: Converts the AI response to speech with ElevenLabs

## Requirements

- Chrome, Edge, or Safari for Web Speech API (speech-to-text)
- HTTPS in production (required for camera/mic access)
