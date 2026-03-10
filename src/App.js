const uploadToAI = async (file, type) => {
  setScn(true); setSs("Analisi Gemini...");
  try {
    const b64 = await new Promise(r => {
      const rd = new FileReader();
      rd.onload = () => r(rd.result.split(',')[1]);
      rd.readAsDataURL(file);
    });

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageB64: b64,
        mimeType: file.type || "image/jpeg",
        prompt: `Analizza questa pagina Kids&Us. Due colonne. ${type === 'r' ? "Estrai Routine A e B." : "Estrai attività Day."} Rispondi SOLO con il JSON puro, senza commenti o markdown.`
      })
    });

    const d = await res.json();
    // Gemini restituisce testo pulito, cerchiamo il JSON
    const cleanText = d.text.replace(/```json|```/g, "");
    const parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

    if (type === "r") {
      const newR = { ...routines, [`${sc.id}|${sp}`]: parsed };
      setR(newR); localStorage.setItem("k_r", JSON.stringify(newR));
    } else {
      const key = `${sc.id}|${sp}|${sd}`;
      const newL = { ...lessons, [key]: parsed };
      setL(newL); localStorage.setItem("k_l", JSON.stringify(newL));
    }
    setSs("✅ Ottimo!");
  } catch (e) {
    setSs(`❌ Errore Gemini: ${e.message}`);
  }
  setTimeout(() => setScn(false), 4000);
};
