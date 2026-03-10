import React, { useState, useRef } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",bg:"#F0F7E1",em:"\u{1F42D}",age:"1 anno",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"linda",name:"Linda",color:"#F26522",bg:"#FFF0E6",em:"\u{1F431}",age:"2 anni",parts:["Part One","Part Two","Part Three","Part Four"],dp:10},
  {id:"sam",name:"Sam",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F9F8}",age:"3 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"emma",name:"Emma",color:"#E878A0",bg:"#FFF0F5",em:"\u{1F98B}",age:"4 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"oliver",name:"Oliver",color:"#00B3B0",bg:"#E0F7F7",em:"\u{1F438}",age:"5 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10},
  {id:"marcia",name:"Marcia",color:"#E94E58",bg:"#FFEBEE",em:"\u{1F380}",age:"6 anni",parts:["Story 1","Story 2","Story 3","Story 4"],dp:10}
];

const ROUTINE_DATA = {
  A: { name: "1.- WARM-UP ROUTINES (Version A)", duration: 10, description: "Hello & Register, Checking Booklets, Weather, Moods & Song.", targetLanguage: "Greetings, Weather, Moods", isRoutine: true },
  B: { name: "1.- WARM-UP ROUTINES (Version B)", duration: 10, description: "Advanced Routine: Group interaction, Weather questions & advanced Moods.", targetLanguage: "Questions & Answers, Weather structures", isRoutine: true }
};

export default function App() {
  const [view, setV] = useState("home");
  const [lessons, setL] = useState({});
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState(null);
  const [sd, setSd] = useState(null);
  const [rVer, setRVer] = useState("A"); // Scelta versione A o B
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const fr = useRef(null);

  const scanD = async (files) => {
    if (!files.length || !sc) return;
    setScn(true); setSs("Analisi PDF... Attendi qualche secondo.");
    try {
      const imgs = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imgs.push({
          type: file.type === "application/pdf" ? "document" : "image",
          source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 }
        });
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          messages: [{
            role: "user",
            content: [
              ...imgs,
              { type: "text", text: "Analizza la Teacher Guide e restituisci SOLO un array JSON delle attività saltando il punto 1. Formato: [{\"name\":\"...\",\"duration\":5,\"description\":\"...\",\"targetLanguage\":\"...\"}]" }
            ]
          }]
        })
      });

      if (!res.ok) throw new Error("Vercel Timeout o Errore API");
      
      const d = await res.json();
      const txt = d.content[0].text;
      const match = txt.match(/\[[\s\S]*\]/);
      const acts = JSON.parse(match[0]);
      
      // Aggiungiamo la routine scelta dall'utente in cima
      const finalActivities = [ROUTINE_DATA[rVer], ...acts];
      
      setL(prev => ({ ...prev, [`${sc.id}|${sp}|${sd}`]: { activities: finalActivities } }));
      setSs("Caricamento completato!");
      setTimeout(() => setScn(false), 2000);
    } catch (e) {
      setSs("Errore: Il file è troppo pesante o la connessione è instabile.");
      setTimeout(() => setScn(false), 4000);
    }
  };

  const cl = sc && sp && sd ? lessons[`${sc.id}|${sp}|${sd}`] : null;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 25, color: "#3C3C3B" }}>I tuoi corsi Kids&Us 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: `6px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: 30 }}>{c.em}</span>
              <b style={{ fontSize: 18 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color, cursor: "pointer" }}>← HOME</button>
          <h2 style={{ color: sc.color, fontWeight: 900, marginBottom: 20 }}>{sc.em} {sc.name}</h2>
          {sc.parts.map(p => (
            <div key={p} style={{ marginBottom: 25 }}>
              <h4 style={{ color: "#555", marginBottom: 10 }}>{p}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))", gap: 8 }}>
                {[...Array(sc.dp)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff", fontWeight: 800, cursor: "pointer" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color, cursor: "pointer" }}>← CORSO</button>
          
          <div style={{ background: "#fff", padding: 25, borderRadius: 24, border: "1px solid #eee", marginBottom: 20 }}>
             <h3 style={{ fontWeight: 900, color: sc.color, marginBottom: 15 }}>{sc.name} - Day {sd}</h3>
             
             <div style={{ marginBottom: 20, background: "#f9f9f9", padding: 15, borderRadius: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Scegli versione Routines:</p>
                <div style={{ display: "flex", gap: 10 }}>
                   <button onClick={() => setRVer("A")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: rVer === "A" ? "#3C3C3B" : "#ddd", color: "#fff", fontWeight: 700 }}>Version A</button>
                   <button onClick={() => setRVer("B")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: rVer === "B" ? "#3C3C3B" : "#ddd", color: "#fff", fontWeight: 700 }}>Version B</button>
                </div>
             </div>

             <input type="file" multiple onChange={e => scanD(e.target.files)} ref={fr} style={{display:"none"}} accept="image/*,application/pdf" />
             <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", border: "none", padding: "14px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}>📸 CARICA E SCANSIONA TG</button>
             {scn && <div style={{ marginTop: 20, fontWeight: 700, color: "#F26522" }}>{ss}</div>}
          </div>

          {cl && (
            <div style={{ marginTop: 20 }}>
              {cl.activities.map((a, i) => (
                <div key={i} style={{ background: "#fff", padding: 18, marginBottom: 12, borderRadius: 16, borderLeft: `5px solid ${a.isRoutine ? "#3C3C3B" : sc.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <b style={{ fontSize: 15 }}>{a.name}</b>
                    <span style={{ fontWeight: 800, color: sc.color }}>{a.duration}'</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>{a.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
