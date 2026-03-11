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
  const [isLive, setIsLive] = useState(false);
  const fr = useRef(null);

  useEffect(() => {
    const r = localStorage.getItem("k_r");
    const l = localStorage.getItem("k_l");
    if (r) setR(JSON.parse(r));
    if (l) setL(JSON.parse(l));
  }, []);

  const uploadToAI = async (file, type) => {
    setScn(true); setSs("Gemini sta analizzando i dettagli...");
    try {
      const b64 = await new Promise(r => {
        const rd = new FileReader();
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.readAsDataURL(file);
      });

      const promptMsg = type === 'r' 
        ? "Analizza la pagina Kids&Us. Estrai la Routine A e la Routine B. Per ogni attività scrivi: nome, durata, descrizione e materiali necessari. Rispondi SOLO JSON: { \"a\": [{\"name\",\"duration\",\"desc\",\"materials\"}], \"b\": [{\"name\",\"duration\",\"desc\",\"materials\"}] }"
        : "Analizza questa lezione Kids&Us. Estrai tutte le attività (incluse Bonus Activities). Per ogni attività cerca il 'Target Language' (solitamente in grassetto). Rispondi SOLO JSON: [{\"name\",\"duration\",\"desc\",\"target_language\",\"materials\",\"is_bonus\"}]";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageB64: b64,
          mimeType: file.type || "image/jpeg",
          prompt: promptMsg
        })
      });

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
      setSs("✅ Dati estratti con successo!");
    } catch (e) {
      setSs(`❌ Errore: ${e.message}`);
    }
    setTimeout(() => setScn(false), 3000);
  };

  const currentVer = sc && sp ? (localStorage.getItem(`v|${sc.id}|${sp}`) || "a") : "a";
  const curR = routines[`${sc?.id}|${sp}`]?.[currentVer] || [];
  const curL = lessons[`${sc?.id}|${sp}|${sd}`] || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={isLive ? "live-mode" : ""} style={{ minHeight: "100vh", fontFamily: "sans-serif", background: isLive ? "#000" : "#FAFAF7", padding: isLive ? 0 : 20 }}>
      <style>{`
        @media print {
          button, .no-print { display: none !important; }
          body { background: white !important; }
          .print-sheet { box-shadow: none !important; border: 1px solid #eee !important; }
        }
        .live-mode { color: white !important; }
      `}</style>

      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 25 }}>Lesson Planner Live 🚀</h2>
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
          <button onClick={() => setV("home")} className="no-print" style={{ marginBottom: 20, border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← INDIETRO</button>
          <h1 style={{ color: sc.color }}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <b>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #ddd" }}>
                   📸 Carica Routine (A/B)
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 10, borderRadius: 8, border: "1px solid #eee", background: lessons[`${sc.id}|${p}|${i+1}`] ? "#e8f5e9" : "#fff" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "r")} />
        </div>
      )}

      {view === "lesson" && sc && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setV("course")} style={{ border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← {sp}</button>
            <div>
              <button onClick={() => setIsLive(!isLive)} style={{ marginRight: 10, padding: "8px 15px", borderRadius: 10, border: "none", background: "#333", color: "#fff" }}>{isLive ? "Esci da Live" : "Vai in Live 📺"}</button>
              <button onClick={handlePrint} style={{ padding: "8px 15px", borderRadius: 10, border: "none", background: sc.color, color: "#fff" }}>Stampa 🖨️</button>
            </div>
          </div>

          <div className="print-sheet" style={{ background: isLive ? "#111" : "#fff", padding: 30, borderRadius: 25, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
             <h2 style={{ color: sc.color, textAlign: "center", margin: 0 }}>{sc.name} - {sp}</h2>
             <h4 style={{ textAlign: "center", marginTop: 5, color: "#888" }}>Day {sd}</h4>
             
             <div className="no-print" style={{ display: "flex", gap: 10, margin: "20px 0" }}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); window.location.reload(); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: currentVer === v ? "#333" : "#eee", color: currentVer === v ? "#fff" : "#888", fontWeight: "bold" }}>VERSION {v.toUpperCase()}</button>
                ))}
             </div>

             <div className="no-print" style={{ marginBottom: 20 }}>
                <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", padding: 15, borderRadius: 15, border: "none", fontWeight: "bold" }}>📸 SCANSIONA PAGINA LEZIONE</button>
                <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "l")} />
             </div>

             {/* SEZIONE ROUTINE */}
             <div style={{ marginBottom: 30 }}>
                <h5 style={{ borderBottom: "2px solid #eee", paddingBottom: 5, color: sc.color }}>ROUTINE (Version {currentVer.toUpperCase()})</h5>
                {curR.map((r, i) => (
                  <div key={i} style={{ marginBottom: 15, padding: 10, borderLeft: "4px solid #333" }}>
                    <b>{r.name} ({r.duration}')</b>
                    <p style={{ margin: "5px 0", fontSize: 14 }}>{r.desc}</p>
                    {r.materials && <small style={{ color: "#888" }}>🛠️ {r.materials}</small>}
                  </div>
                ))}
             </div>

             {/* SEZIONE LEZIONE */}
             <div>
                <h5 style={{ borderBottom: "2px solid #eee", paddingBottom: 5, color: sc.color }}>ACTIVITIES</h5>
                {curL.map((a, i) => (
                  <div key={i} style={{ marginBottom: 20, padding: 15, borderRadius: 12, background: a.is_bonus ? "#fffde7" : "transparent", border: a.is_bonus ? "1px dashed #fbc02d" : "none", borderLeft: a.is_bonus ? "8px solid #fbc02d" : `8px solid ${sc.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <b>{a.is_bonus && "⭐ "} {a.name}</b>
                      <span>{a.duration}'</span>
                    </div>
                    {a.target_language && <div style={{ background: "#f0f0f0", padding: "5px 10px", borderRadius: 5, margin: "8px 0", fontSize: 13, fontWeight: "bold", color: "#333" }}>🎯 {a.target_language}</div>}
                    <p style={{ fontSize: 14, marginTop: 5 }}>{a.desc}</p>
                    {a.materials && <small style={{ color: "#888" }}>📦 {a.materials}</small>}
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 20, zIndex: 100 }}>{ss}</div>}
    </div>
  );
}
