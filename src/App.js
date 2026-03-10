import React, { useState, useRef, useEffect } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",em:"\u{1F42D}"},
  {id:"linda",name:"Linda",color:"#F26522",em:"\u{1F431}"},
  {id:"sam",name:"Sam",color:"#00B3B0",em:"\u{1F9F8}"},
  {id:"emma",name:"Emma",color:"#E878A0",em:"\u{1F98B}"},
  {id:"oliver",name:"Oliver",color:"#00B3B0",em:"\u{1F438}"},
  {id:"marcia",name:"Marcia",color:"#E94E58",em:"\u{1F380}"}
];

export default function App() {
  const [view, setV] = useState("home");
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState("");
  const [sd, setSd] = useState(null);
  const [lessons, setL] = useState({});
  const [routines, setR] = useState({});
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const fr = useRef(null);

  useEffect(() => {
    const r = localStorage.getItem("k_r");
    const l = localStorage.getItem("k_l");
    if (r) setR(JSON.parse(r));
    if (l) setL(JSON.parse(l));
  }, []);

  const uploadToAI = async (file, type) => {
    setScn(true); 
    setSs("Inizio caricamento...");
    
    try {
      const b64 = await new Promise((resolve, reject) => {
        const rd = new FileReader();
        rd.onload = () => resolve(rd.result.split(',')[1]);
        rd.onerror = reject;
        rd.readAsDataURL(file);
      });

      setSs("Analisi in corso (Claude)...");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              { 
                type: file.type === "application/pdf" ? "document" : "image", 
                source: { 
                  type: "base64", 
                  media_type: file.type || "image/jpeg", 
                  data: b64 
                } 
              },
              { 
                type: "text", 
                text: `Analizza questa pagina Kids&Us. Due colonne. 
                ${type === 'r' ? "Estrai Routine A e B." : "Estrai attività Day."}
                Rispondi SOLO JSON: [{"name","duration","desc","target"}]` 
              }
            ]
          }]
        })
      });

      // DIAGNOSTICA: Se il server risponde male, leggiamo il perché
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Server Error (${res.status}): ${errorData.error || "Unknown"}`);
      }

      const d = await res.json();
      
      if (!d.content || !d.content[0]) {
        throw new Error("Risposta AI vuota o non valida");
      }

      const parsed = JSON.parse(d.content[0].text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      if (type === "r") {
        const newR = { ...routines, [`${sc.id}|${sp}`]: parsed };
        setR(newR); 
        localStorage.setItem("k_r", JSON.stringify(newR));
      } else {
        const key = `${sc.id}|${sp}|${sd}`;
        const newL = { ...lessons, [key]: parsed };
        setL(newL); 
        localStorage.setItem("k_l", JSON.stringify(newL));
      }
      setSs("✅ Completato!");
    } catch (e) {
      console.error("DEBUG ERROR:", e);
      setSs(`❌ ${e.message}`); // Qui vedremo l'errore specifico sullo schermo
    }
    setTimeout(() => setScn(false), 6000); // Messaggio visibile per 6 secondi per leggerlo bene
  };

  const curR = routines[`${sc?.id}|${sp}`];
  const ver = localStorage.getItem(`v|${sc?.id}|${sp}`) || "a";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 25 }}>Kids&Us Planner 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 22, marginBottom: 15, borderRadius: 20, borderLeft: `8px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 35 }}>{c.em}</span>
              <b style={{ fontSize: 22 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 25, border: "none", background: "none", fontWeight: 800, color: sc.color, fontSize: 16 }}>← HOME</button>
          <h1 style={{ color: sc.color, fontWeight: 900, fontSize: 32, marginBottom: 25 }}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 18, borderRadius: 20, marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <b style={{ fontSize: 18 }}>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 12, background: routines[`${sc.id}|${p}`] ? "#E8F5E9" : "#F5F5F5", color: routines[`${sc.id}|${p}`] ? "#2E7D32" : "#888", padding: "8px 14px", borderRadius: 10, border: "none", fontWeight: 800 }}>
                  {routines[`${sc.id}|${p}`] ? "✅ Routine OK" : "📸 Carica Routine"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 14, borderRadius: 12, border: "1px solid #eee", background: "#fdfdfd", fontWeight: 800 }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "r")} />
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← {sp}</button>
          <div style={{ background: "#fff", padding: 25, borderRadius: 24, border: "1px solid #eee", marginBottom: 25, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
             <h3 style={{ fontWeight: 900, color: sc.color, fontSize: 24 }}>Day {sd}</h3>
             <div style={{ display: "flex", gap: 10, margin: "20px 0" }}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); setSs(v); }} style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: ver === v ? "#3C3C3B" : "#eee", color: ver === v ? "#fff" : "#888", fontWeight: 800 }}>Version {v.toUpperCase()}</button>
                ))}
             </div>
             <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", padding: "18px", borderRadius: 18, border: "none", fontWeight: 800 }}>📸 SCANSIONA LEZIONE</button>
             <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "l")} />
          </div>

          <div style={{ marginTop: 25 }}>
            {curR?.[ver]?.map((r, i) => (
              <div key={i} style={{ background: "#fff", padding: 22, marginBottom: 15, borderRadius: 20, borderLeft: "8px solid #3C3C3B" }}>
                <b>{r.name}</b> <span style={{float:"right", color:"#aaa"}}>{r.duration}'</span>
                <p style={{ fontSize: 15, color: "#666", marginTop: 8 }}>{r.desc}</p>
              </div>
            ))}
            {lessons[`${sc.id}|${sp}|${sd}`]?.map((a, i) => (
              <div key={i} style={{ background: "#fff", padding: 22, marginBottom: 15, borderRadius: 20, borderLeft: `8px solid ${sc.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{a.name}</b> <span>{a.duration}'</span></div>
                <p style={{ fontSize: 15, color: "#666", marginTop: 8 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", background: "#3C3C3B", color: "#fff", padding: "16px 32px", borderRadius: 15, zIndex: 2000, fontWeight: 800, width: "80%", textAlign: "center" }}>{ss}</div>}
    </div>
  );
}
