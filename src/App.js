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
    setScn(true); setSs("Inviando a Gemini...");
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
          prompt: `Analizza questa pagina Kids&Us. Due colonne. ${type === 'r' ? "Estrai Routine A e B." : "Estrai attività dal punto 2 in poi."} Rispondi SOLO JSON: [{"name","duration","desc","target"}]`
        })
      });

      if (!res.ok) throw new Error("Errore Server");
      
      const d = await res.json();
      const cleanText = d.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      if (type === "r") {
        const newR = { ...routines, [`${sc.id}|${sp}`]: parsed };
        setR(newR); localStorage.setItem("k_r", JSON.stringify(newR));
      } else {
        const key = `${sc.id}|${sp}|${sd}`;
        const newL = { ...lessons, [key]: parsed };
        setL(newL); localStorage.setItem("k_l", JSON.stringify(newL));
      }
      setSs("✅ Analisi completata!");
    } catch (e) {
      setSs(`❌ Errore: ${e.message}`);
    }
    setTimeout(() => setScn(false), 5000);
  };

  const curR = routines[`${sc?.id}|${sp}`];
  const ver = (sc && sp) ? (localStorage.getItem(`v|${sc.id}|${sp}`) || "a") : "a";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 25 }}>Kids&Us Planner (Gemini) 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 15, borderRadius: 15, borderLeft: `8px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 30 }}>{c.em}</span>
              <b style={{ fontSize: 20 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← INDIETRO</button>
          <h1 style={{ color: sc.color }}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <b>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #ddd" }}>
                   📸 Carica Routine
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 10, borderRadius: 8, border: "1px solid #eee" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "r")} />
        </div>
      )}

      {view === "lesson" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← {sp}</button>
          <div style={{ background: "#fff", padding: 20, borderRadius: 20, textAlign: "center" }}>
             <h3>Day {sd}</h3>
             <div style={{ display: "flex", gap: 10, margin: "15px 0" }}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); setSs(`Versione ${v.toUpperCase()}`); setTimeout(()=>setSs(""), 1000); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: ver === v ? "#333" : "#eee", color: ver === v ? "#fff" : "#888" }}>Version {v.toUpperCase()}</button>
                ))}
             </div>
             <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", padding: 15, borderRadius: 15, border: "none", fontWeight: "bold" }}>📸 SCANSIONA PAGINA</button>
             <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "l")} />
          </div>

          <div style={{ marginTop: 20 }}>
            {curR?.[ver]?.map((r, i) => (
              <div key={i} style={{ background: "#fff", padding: 15, marginBottom: 10, borderRadius: 15, borderLeft: "5px solid #333" }}>
                <b>{r.name}</b> <span style={{float:"right"}}>{r.duration}'</span>
                <p style={{ fontSize: 14, color: "#666" }}>{r.desc}</p>
              </div>
            ))}
            {lessons[`${sc.id}|${sp}|${sd}`]?.map((a, i) => (
              <div key={i} style={{ background: "#fff", padding: 15, marginBottom: 10, borderRadius: 15, borderLeft: `5px solid ${sc.color}` }}>
                <b>{a.name}</b> <span style={{float:"right"}}>{a.duration}'</span>
                <p style={{ fontSize: 14, color: "#666" }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 20, zIndex: 100 }}>{ss}</div>}
    </div>
  );
}
