const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
// Aumentiamo il limite di peso a 50MB per accettare i tuoi PDF pesanti
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // La chiave è al sicuro nel sistema
});

app.post('/api/generate', async (req, res) => {
  try {
    const response = await anthropic.messages.create(req.body);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Serve l'app React
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
