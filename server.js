const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Inizializziamo senza forzare versioni beta
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

app.post('/api/generate', async (req, res) => {
  try {
    // Usiamo il nome modello standard
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
    console.error("ERRORE DETTAGLIATO:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Render usa la porta 10000 di default, la impostiamo correttamente
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));
