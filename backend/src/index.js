const express = require('express');
const cors = require('cors');
const { port, frontendUrl } = require('./config');
const authRoutes = require('./routes/auth');
const teachRoutes = require('./routes/teach');
const voiceRoutes = require('./routes/voice');

const app = express();
app.use(cors({ origin: frontendUrl }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/teach', teachRoutes);
app.use('/api/voice', voiceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});