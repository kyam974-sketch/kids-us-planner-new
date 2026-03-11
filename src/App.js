import React, { useState, useRef, useEffect } from "react";

const CS = [
  {id:"mousy",name:"Mousy",color:"#8CB43B",em:"\u{1F42D}",type:"baby", limit:45},
  {id:"linda",name:"Linda",color:"#F26522",em:"\u{1F431}",type:"baby", limit:45},
  {id:"sam",name:"Sam",color:"#00B3B0",em:"\u{1F9F8}",type:"kids", limit:60},
  {id:"emma",name:"Emma",color:"#E878A0",em:"\u{1F98B}",type:"kids", limit:60},
  {id:"oliver",name:"Oliver",color:"#00B3B0",em:"\u{1F438}",type:"kids", limit:60},
  {id:"marcia",name:"Marcia",color:"#E94E58",em:"\u{1F380}",type:"kids", limit:60},
  {id:"pam",name:"Pam & Paul",color:"#FFD700",em:"\u{1F46B}",type:"kids", limit:60},
  {id:"ben",name:"Ben & Brenda",color:"#4B0082",em:"\u{1F9D1}",type:"teens", limit:90}
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
    setScn(true); setSs("Analisi millimetrica in corso...");
    try {
      const b64 = await new Promise(r => {
        const rd = new FileReader();
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.readAsDataURL(file);
      });

      const promptMsg = type === 'r' 
        ? "Estrai Routine A e B. Includi SEMPRE la parte finale (Story/Choosing Rhyme). Formato JSON: {\"a\":[{\"name\",\"duration\",\"desc\",\"materials\"}], \"b\":[{\"name\",\"duration\",\"desc\",\"materials\"}]}"
        : "Estrai attività. Cerca Target Language in GRASSETTO. Se 'Bonus' o 'Optional' metti is_bonus:true. JSON: [{\"name\",\"duration\",\"desc\",\"target\",\"materials\",\"is_bonus\"}]";

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
      setSs("✅ Dati caricati!");
    } catch (e) { setSs(`❌ Errore: ${e.message}`); }
    setTimeout(() => setScn(false), 3000);
  };

  const deleteAct = (idx) => {
    const key = `${sc.id}|${sp}|${sd}`;
    const newL = [...(lessons[key] || [])];
    newL.splice(idx, 1);
    save({ ...lessons, [key]: newL }, null);
  };

  const moveAct = (idx, dir) => {
    const key = `${sc.id}|${sp}|${sd}`;
    const newL = [...(lessons[key] || [])];
    const item = newL.splice(idx, 1)[0];
    newL.splice(idx + dir, 0, item);
    save({ ...lessons, [key]: newL }, null);
  };

  const currentVer = sc && sp ? (localStorage.getItem(`v|${sc.id}|${sp}`) || "a") : "a";
  const curR = routines[`${sc?.id}|${sp}`]?.[currentVer] || [];
  const curL = lessons[`${sc?.id}|${sp}|${sd}`] || [];
  
  // Per Mousy/Linda le Optional contano nei 45 min
  const normalActs = curL.filter(a => !a.is_bonus || sc.type === "baby");
  const bonusActs = curL.filter(a => a.is_bonus && sc.type !== "baby");
  const fullPlan = [...curR, ...normalActs];

  let totalMinutes = 0;
  let lastTime = startTime;
  const planWithTimes = fullPlan.map((act, i) => {
    const dur = parseInt(act.duration) || 0;
    totalMinutes += dur;
    const [h, m] = lastTime.split(":").map(Number);
    const start = lastTime;
    const date = new Date(0,0,0, h, m + dur);
    lastTime = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    return { ...act, start, end: lastTime };
  });

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F8F9FA", color: isLive ? "#fff" : "#333", fontFamily: 'Segoe UI, sans-serif' }}>
      <style>{`
        @media print { .no-print { display: none !important; } .sheet { box-shadow:none !important; padding:0 !important; } }
        .controls { opacity: 0; transition: 0.2s; }
        .act-card:hover .controls { opacity: 1; }
      `}</style>

      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center", fontWeight:900, fontSize:35, marginBottom:40}}>Kids&Us Planner 🎓</h1>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 30, borderRadius: 25, borderBottom: `8px solid ${c.color}`, cursor: "pointer", textAlign:"center", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 45, marginBottom: 15 }}>{c.em}</div>
                <b style={{ fontSize: 18 }}>{c.name}</b>
                <div style={{ fontSize: 10, color: "#999", marginTop: 5 }}>Target: {c.limit} min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 650, margin: "0 auto", padding: 25 }}>
          <button onClick={() => setV("home")} style={{background:"none", border:"none", fontWeight:900, color:sc.color, cursor:"pointer", marginBottom:20}}>← LISTA CORSI</button>
          <h1 style={{color:sc.color, fontSize:45, margin:0}}>{sc.name}</h1>
          <p style={{opacity:0.5, marginBottom:30}}>Story & Routine ({sc.limit} min totali)</p>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 20, borderRadius: 25, marginBottom: 20, boxShadow:"0 5px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems:"center", marginBottom:20 }}>
                <b style={{fontSize:22}}>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{background:sc.color, color:"#fff", border:"none", padding:"10px 18px", borderRadius:12, fontSize:12, fontWeight:800, cursor:"pointer"}}>CARICA ROUTINE</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 18, borderRadius: 15, border: "2px solid #F0F0F0", background: lessons[`${sc.id}|${p}|${i+1}`] ? "#E8F5E9" : "#fff", fontWeight:800, cursor:"pointer" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "r")} />
        </div>
      )}

      {view === "lesson" && sc && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isLive ? 0 : 30 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems:"center", marginBottom: 30, background: isLive ? "#1A1A1A" : "#fff", padding: "15px 25px", borderRadius: 20, boxShadow:"0 10px 30px rgba(0,0,0,0.05)" }}>
            <button onClick={() => setV("course")} style={{ border: "none", background: "none", fontWeight: 800, color: sc.color, cursor:"pointer" }}>← {sp}</button>
            <div style={{display:"flex", gap:20, alignItems:"center"}}>
               <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, fontWeight:900, color: totalMinutes > sc.limit ? "#FF4757" : "#2ED573"}}>
                    TEMPO: {totalMinutes} / {sc.limit} min
                  </div>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{border:"none", background:"#F1F2F6", padding:"5px 10px", borderRadius:8, fontWeight:900}} />
               </div>
               <button onClick={() => {setStartTime(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})); setIsLive(true);}} style={{ background: "#2ED573", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 15, fontWeight:900, cursor:"pointer" }}>PLAY LIVE ▶️</button>
               <button onClick={() => window.print()} style={{ background: "#2F3542", color: "#fff", border: "none", padding: "12px 25px", borderRadius: 15, cursor:"pointer" }}>STAMPA</button>
            </div>
          </div>

          <div className="sheet" style={{ background: isLive ? "#000" : "#fff", padding: isLive ? 20 : 45, borderRadius: isLive ? 0 : 35, boxShadow: isLive ? "none" : "0 20px 50px rgba(0,0,0,0.05)" }}>
            
            {!isLive && (
              <div style={{background:"#F8F9FA", padding:25, borderRadius:25, marginBottom:40, border:"2px solid #E9ECEF"}}>
                <b style={{fontSize:13, color:"#ADB5BD", letterSpacing:1}}>CHECKLIST MATERIALI</b>
                <div style={{display:"flex", flexWrap:"wrap", gap:12, marginTop:15}}>
                   {Array.from(new Set(fullPlan.map(a => a.materials).filter(Boolean).join(", ").split(", "))).map((m, i) => (
                     <label key={i} style={{fontSize:14, background:"#fff", padding:"8px 15px", borderRadius:12, border:"1px solid #DEE2E6", display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontWeight:600}}>
                        <input type="checkbox" style={{width:18, height:18}} /> {m}
                     </label>
                   ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:40}}>
              <h1 style={{margin:0, color:sc.color, fontSize:45, fontWeight:900}}>{sc.name} <span style={{fontWeight:300}}>Day {sd}</span></h1>
              <div style={{display:"flex", gap:10, marginTop:15}}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); window.location.reload(); }} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: currentVer === v ? sc.color : "#F1F2F6", color: currentVer === v ? "#FFF" : "#A4B0BE", fontWeight:900, fontSize:12, cursor:"pointer" }}>VERSION {v.toUpperCase()}</button>
                ))}
              </div>
            </div>

            {planWithTimes.map((a, i) => (
              <div key={i} className="act-card" style={{ display: "flex", gap: 25, marginBottom: 35, borderLeft: `8px solid ${i < curR.length ? "#2F3542" : sc.color}`, paddingLeft: 25, position:"relative" }}>
                <div style={{ minWidth: 90, fontWeight: 900, color: sc.color, fontSize: 20 }}>
                  {a.start}<br/><span style={{fontSize:12, opacity:0.3}}>{a.end}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems:"flex-start" }}>
                    <b style={{fontSize:22, lineHeight:1.2}}>{a.is_bonus ? "⭐ " : ""}{a.name}</b>
                    <div className="no-print controls" style={{display:"flex", gap:10}}>
                       {i >= curR.length && (
                         <>
                           <button onClick={() => moveAct(i - curR.length, -1)} style={{background:"#eee", border:"none", borderRadius:5, padding:5}}>↑</button>
                           <button onClick={() => moveAct(i - curR.length, 1)} style={{background:"#eee", border:"none", borderRadius:5, padding:5}}>↓</button>
                           <button onClick={() => deleteAct(i - curR.length)} style={{background:"#FFEBEB", border:"none", borderRadius:5, padding:5, color:"#FF4757"}}>🗑️</button>
                         </>
                       )}
                    </div>
                  </div>
                  {a.target && <div style={{ fontSize: 14, background: isLive ? "#1A1A1A" : "#F1F2F6", padding: "10px 15px", borderRadius: 12, margin: "15px 0", fontWeight: 800, color: isLive ? sc.color : "#2F3542", borderLeft:`4px solid ${sc.color}` }}>🎯 {a.target}</div>}
                  <p style={{ fontSize: 17, lineHeight: 1.6, margin: "12px 0", opacity: 0.8 }}>{a.desc}</p>
                </div>
              </div>
            ))}

            {bonusActs.length > 0 && (
              <div style={{marginTop:50, padding:35, background:"#FFF9DB", borderRadius:35, border:"3px dashed #FAB005"}}>
                <b style={{color:"#F08C00", fontSize:16, letterSpacing:1}}>⭐ BONUS ACTIVITIES</b>
                {bonusActs.map((b, i) => (
                  <div key={i} style={{marginTop:20, borderBottom:"2px solid #FFF3BF", paddingBottom:20}}>
                    <b style={{fontSize:20, color:"#444"}}>{b.name}</b>
                    <p style={{fontSize:16, margin:"10px 0", color:"#666"}}>{b.desc}</p>
                    {b.target && <small style={{fontWeight:800}}>🎯 {b.target}</small>}
                  </div>
                ))}
              </div>
            )}

            {!isLive && (
              <button onClick={() => fr.current.click()} style={{ width: "100%", background: "#F8F9FA", border: "3px dashed #DEE2E6", padding: 40, borderRadius: 30, marginTop: 40, color:"#A4B0BE", fontWeight:800, cursor:"pointer", fontSize:16 }}>
                 📸 SCANSIONA O AGGIORNA LEZIONE
              </button>
            )}
            <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files[0], "l")} />
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", background: "#2F3542", color: "#fff", padding: "18px 40px", borderRadius: 50, fontWeight:900, boxShadow:"0 15px 40px rgba(0,0,0,0.3)", zIndex:1000 }}>{ss}</div>}
    </div>
  );
}
