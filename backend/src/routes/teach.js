const express = require('express');
const { jwtCheck } = require('../middleware/auth');
const geminiService = require('../services/gemini');
const router = express.Router();

router.post('/', jwtCheck, async (req, res) => {
  const { lesson } = req.body;
  try {
    const response = await geminiService.teach(lesson);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ask', jwtCheck, async (req, res) => {
  const { context } = req.body;
  try {
    const question = await geminiService.askQuestion(context);
    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/summarize', jwtCheck, async (req, res) => {
  const { context } = req.body;
  try {
    const summary = await geminiService.summarize(context);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;