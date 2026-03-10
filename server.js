const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Inizializzazione corretta per le nuove versioni
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/generate', async (req, res) => {
  try {
    // Specifichiamo il modello senza beta o prefissi strani
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash"
    });

    const { imageB64, mimeType, prompt } = req.body;

    // Struttura dati esatta richiesta da Gemini 1.5
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageB64,
          mimeType: mimeType
        }
      },
      { text: prompt }
    ]);
    
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error) {
    console.error("ERRORE DETTAGLIATO:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== SERVER OPERATIVO SULLA PORTA ${PORT} ===`);
});
