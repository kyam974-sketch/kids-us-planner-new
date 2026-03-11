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
  const [startTime, setStartTime] = useState("16:30");
  const fr = useRef(null);

  useEffect(() => {
    const r = localStorage.getItem("k_r");
    const l = localStorage.getItem("k_l");
    if (r) setR(JSON.parse(r));
    if (l) setL(JSON.parse(l));
  }, []);

  const save = (newL, newR) => {
    if(newL) { setL(newL); localStorage.setItem("k_l", JSON.stringify(newL)); }
    if(newR) { setR(newR); localStorage.setItem("k_r", JSON.stringify(newR)); }
  };

  const uploadToAI = async (file, type) => {
    setScn(true); setSs("Analisi profonda in corso...");
    try {
      const b64 = await new Promise(r => {
        const rd = new FileReader();
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.readAsDataURL(file);
      });

      const promptMsg = type === 'r' 
        ? "Estrai Routine A e Routine B separatamente. Cerca i titoli in neretto per il Target Language. Rispondi SOLO JSON: { \"a\": [{\"name\",\"duration\",\"desc\",\"target\",\"materials\"}], \"b\": [{\"name\",\"duration\",\"desc\",\"target\",\"materials\"}] }"
        : "Estrai le attività della lezione. Fondamentale: estrai il testo in GRASSETTO come 'target'. Includi materiali e bonus activities. Rispondi SOLO JSON: [{\"name\",\"duration\",\"desc\",\"target\",\"materials\",\"is_bonus\"}]";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64, mimeType: file.type || "image/jpeg", prompt: promptMsg })
      });

      const d = await res.json();
      const cleanText = d.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      if (type === "r") {
        save(null, { ...routines, [`${sc.id}|${sp}`]: parsed });
      } else {
        save({ ...lessons, [`${sc.id}|${sp}|${sd}`]: parsed }, null);
      }
      setSs("✅ Completato!");
    } catch (e) {
      setSs(`❌ Errore: ${e.message}`);
    }
    setTimeout(() => setScn(false), 3000);
  };

  const deleteLesson = () => {
    if(window.confirm("Cancellare questa lezione?")) {
      const newL = {...lessons};
      delete newL[`${sc.id}|${sp}|${sd}`];
      save(newL, null);
    }
  };

  const currentVer = sc && sp ? (localStorage.getItem(`v|${sc.id}|${sp}`) || "a") : "a";
  const curR = routines[`${sc?.id}|${sp}`]?.[currentVer] || [];
  const curL = lessons[`${sc?.id}|${sp}|${sd}`] || [];
  const fullPlan = [...curR, ...curL];

  // Calcolo Orari
  let lastTime = startTime;
  const planWithTimes = fullPlan.map(act => {
    const [h, m] = lastTime.split(":").map(Number);
    const start = lastTime;
    const dur = parseInt(act.duration) || 5;
    const date = new Date(0,0,0, h, m + dur);
    lastTime = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    return { ...act, start, end: lastTime };
  });

  const updateAct = (idx, field, val) => {
    const key = `${sc.id}|${sp}|${sd}`;
    const newL = [...curL];
    newL[idx][field] = val;
    save({ ...lessons, [key]: newL }, null);
  };

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#111" : "#FAFAF7", color: isLive ? "#fff" : "#333", fontFamily: 'system-ui' }}>
      <style>{`@media print { .no-print { display: none !important; } .print-area { box-shadow:none !important; padding:0 !important; } }`}</style>

      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <h2 style={{fontWeight:900}}>Kids&Us Planner Pro 🚀</h2>
          <button onClick={() => {if(window.confirm("Vuoi resettare TUTTO?")) {localStorage.clear(); window.location.reload();}}} style={{fontSize:10, marginBottom:20}}>CANCELLA TUTTA LA CACHE</button>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 15, borderRadius: 15, borderLeft: `8px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, color: "#333" }}>
              <span style={{ fontSize: 30 }}>{c.em}</span>
              <b style={{ fontSize: 20 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <button onClick={() => setV("home")} style={{ border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← INDIETRO</button>
          <h1 style={{ color: sc.color }}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 15, color:"#333" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <b>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8 }}>📸 Carica Routine</button>
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
        <div style={{ maxWidth: 800, margin: "0 auto", padding: isLive ? 0 : 20 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, padding: isLive ? 10 : 0 }}>
            <button onClick={() => setV("course")} style={{ border: "none", background: "none", fontWeight: "bold", color: sc.color }}>← Torna a {sp}</button>
            <div style={{display:"flex", gap:10}}>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{borderRadius:8, border:"1px solid #ddd", padding:5}} />
              <button onClick={() => setIsLive(!isLive)} style={{ background: "#333", color: "#fff", border: "none", padding: "8px 15px", borderRadius: 10 }}>{isLive ? "Esci" : "Live View"}</button>
              <button onClick={deleteLesson} style={{ background: "#ffcdd2", border: "none", padding: "8px 15px", borderRadius: 10 }}>🗑️</button>
              <button onClick={() => window.print()} style={{ background: sc.color, color: "#fff", border: "none", padding: "8px 15px", borderRadius: 10 }}>🖨️</button>
            </div>
          </div>

          <div className="print-area" style={{ background: isLive ? "#000" : "#fff", padding: isLive ? 10 : 30, borderRadius: isLive ? 0 : 20 }}>
            {!isLive && (
              <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); window.location.reload(); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: currentVer === v ? sc.color : "#eee", color: currentVer === v ? "#fff" : "#888", fontWeight: "bold" }}>VERSION {v.toUpperCase()}</button>
                ))}
              </div>
            )}

            <h2 style={{margin:0, color:sc.color}}>{sc.name} - Day {sd}</h2>
            <p style={{marginTop:0, opacity:0.6}}>{sp} - Version {currentVer.toUpperCase()}</p>

            <div style={{ marginTop: 20 }}>
              {planWithTimes.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 15, marginBottom: 15, borderBottom: "1px solid #eee", paddingBottom: 15 }}>
                  <div style={{ minWidth: 60, fontWeight: "bold", color: sc.color, fontSize: 14 }}>
                    {a.start}<br/><span style={{fontSize:10, opacity:0.5}}>{a.end}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <b contentEditable onBlur={e => updateAct(i, 'name', e.target.innerText)} style={{outline:"none"}}>{a.name}</b>
                      <span>{a.duration}'</span>
                    </div>
                    {a.target && <div style={{ fontSize: 12, background: isLive ? "#222" : "#f5f5f5", padding: "4px 8px", borderRadius: 5, marginTop: 5, fontWeight: "bold" }}>🎯 {a.target}</div>}
                    <p contentEditable onBlur={e => updateAct(i, 'desc', e.target.innerText)} style={{ fontSize: 14, margin: "5px 0", outline:"none", opacity: 0.9 }}>{a.desc}</p>
                    {a.materials && <div style={{fontSize:11, opacity:0.6}}>🛠️ {a.materials}</div>}
                  </div>
                </div>
              ))}
            </div>

            <button className="no-print" onClick={() => fr.current.click()} style={{ width: "100%", background: "#eee", border: "2px dashed #ccc", padding: 20, borderRadius: 15, marginTop: 20, cursor: "pointer" }}>
               📸 AGGIUNGI / AGGIORNA PAGINA LEZIONE
            </button>
            <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "l")} />
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 20, zIndex: 100 }}>{ss}</div>}
    </div>
  );
}
