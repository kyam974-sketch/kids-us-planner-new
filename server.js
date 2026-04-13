const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const https = require('https');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/generate', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const { imageB64, mimeType, prompt } = req.body;
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: imageB64, mimeType: mimeType } }
    ]);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error("ERRORE generate:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, role } = req.body;
    if (!text) { return res.status(400).json({ error: "text required" }); }

    // Voce Teacher: femminile adulta en-GB-Neural2-C
    // Voce Children: maschile/acuta en-GB-Neural2-B (pitch alto)
    const voiceName = role === "K" ? "en-GB-Neural2-B" : "en-GB-Neural2-C";
    const pitch = role === "K" ? 4.0 : 0.0;
    const speakingRate = role === "K" ? 1.1 : 0.95;

    const requestBody = JSON.stringify({
      input: { text: text },
      voice: {
        languageCode: "en-GB",
        name: voiceName
      },
      audioConfig: {
        audioEncoding: "MP3",
        pitch: pitch,
        speakingRate: speakingRate,
        effectsProfileId: ["small-bluetooth-speaker-class-device"]
      }
    });

    const apiKey = process.env.GOOGLE_API_KEY;
    const options = {
      hostname: "texttospeech.googleapis.com",
      path: `/v1/text:synthesize?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody)
      }
    };

    const ttsReq = https.request(options, (ttsRes) => {
      let data = "";
      ttsRes.on("data", (chunk) => { data += chunk; });
      ttsRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.error("TTS API error:", parsed.error);
            return res.status(500).json({ error: parsed.error.message });
          }
          res.json({ audioContent: parsed.audioContent });
        } catch (e) {
          res.status(500).json({ error: "Parse error: " + e.message });
        }
      });
    });

    ttsReq.on("error", (e) => {
      console.error("TTS request error:", e.message);
      res.status(500).json({ error: e.message });
    });

    ttsReq.write(requestBody);
    ttsReq.end();

  } catch (error) {
    console.error("ERRORE tts:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== SERVER ALLINEATO AL CURL ===`);
});
