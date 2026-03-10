const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();

// Gestione dei limiti di peso per i PDF di Marcia
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Inizializzazione Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

app.post('/api/generate', async (req, res) => {
  try {
    // Verifichiamo che la chiave esista prima di chiamare Google
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: "Manca la GOOGLE_API_KEY su Render" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const { imageB64, mimeType, prompt } = req.body;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageB64,
          mimeType: mimeType
        }
      }
    ]);
    
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error("ERRORE GEMINI:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve i file statici della cartella 'build' (l'app React)
app.use(express.static(path.join(__dirname, 'build')));

// Gestione di tutte le altre rotte (rimanda a index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// CONFIGURAZIONE PORTA PER RENDER
// Usiamo la porta 10000 o quella assegnata dal sistema
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== SERVER AVVIATO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`Chiave Google: ${process.env.GOOGLE_API_KEY ? "OK" : "MANCANTE"}`);
});
