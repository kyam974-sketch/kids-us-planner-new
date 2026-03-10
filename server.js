const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// DEBUG: Vediamo se la chiave viene letta (stampa solo i primi 5 caratteri per sicurezza)
console.log("Controllo Chiave API:", process.env.ANTHROPIC_API_KEY ? `Presente (inizia con ${process.env.ANTHROPIC_API_KEY.substring(0, 5)})` : "ASSENTE!");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/generate', async (req, res) => {
  try {
    console.log("Chiamata ricevuta per il modello:", req.body.model);
    const response = await anthropic.messages.create(req.body);
    res.json(response);
  } catch (error) {
    // Questo ci dirà esattamente cosa dice Claude al server
    console.error("ERRORE CLAUDE:", error.status, error.message);
    res.status(error.status || 500).json({ 
      error: error.message,
      type: error.type 
    });
  }
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server acceso sulla porta ${PORT}`));
