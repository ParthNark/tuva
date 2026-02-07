const express = require('express');
const { jwtCheck } = require('../middleware/auth');
const elevenlabsService = require('../services/elevenlabs');
const router = express.Router();

router.post('/speak', jwtCheck, async (req, res) => {
  const { text } = req.body;
  try {
    const audioStream = await elevenlabsService.speak(text);
    res.set('Content-Type', 'audio/mpeg');
    audioStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;