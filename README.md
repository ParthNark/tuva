# Tuva - AI Learning Platform

An MVP AI learning platform with 'Teach the AI' mode.

## Tech Stack

- Backend: Node.js + Express
- Frontend: React (Vite)
- AI: Gemini via @google/generative-ai
- Auth: Auth0
- Voice: ElevenLabs
- Whiteboard: Backboard.ai
- UI: Featherless.ai components

## Setup

1. Clone the repo
2. Copy .env.example to .env and fill in keys
3. Backend: cd backend && npm install && npm start
4. Frontend: cd frontend && npm install && npm run dev

## API

- POST /api/teach
- POST /api/teach/ask
- POST /api/teach/summarize
- POST /api/voice/speak