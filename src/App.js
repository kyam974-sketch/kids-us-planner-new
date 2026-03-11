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
  const [library, setLib] = useState({});
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("16:30");
  const [now, setNow] = useState(new Date());
  const fr = useRef(null);

  useEffect(() => {
    const l = localStorage.getItem("k_l_v3");
    const lib = localStorage.getItem("k_lib");
    if (l) setL(JSON.parse(l));
    if (lib) setLib(JSON.parse(lib));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const save = (newL, newLib) => {
    if(newL) { setL(newL); localStorage.setItem("k_l_v3", JSON.stringify(newL)); }
    if(newLib) { setLib(newLib); localStorage.setItem("k_lib", JSON.stringify(newLib)); }
  };

  const uploadToAI = async (files) => {
    setScn(true); setSs("Extracting VERBATIM Target Language...");
    try {
      const b64 = await new Promise(r => {
        const rd = new FileReader();
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.readAsDataURL(files[0]);
      });

      const promptMsg = `Extract Kids&Us lesson activities. 
      IMPORTANT: Copy Target Language EXACTLY as written in quotes. 
      Format target as: "[T] (expression) [K] (expression)". 
      Return ONLY JSON: [{"name","duration","desc","target","materials","is_bonus"}]`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: b64, mimeType: files[0].type || "image/jpeg", prompt: promptMsg }) 
      });

      const d = await res.json();
      const cleanText = d.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      save({ ...lessons, [`${sc.id}|${sp}|${sd}`]: parsed });
      setSs("✅ Content Synced!");
    } catch (e) { setSs(`❌ AI Error: ${e.message}`); }
    setTimeout(() => setScn(false), 3000);
  };

  const copyToLibrary = () => {
    const key = `${sc.id}|${sp}|${sd}`;
    save(null, { ...library, [sc.id]: lessons[key] });
    setSs("📁 Saved to Course Library!");
  };

  const pasteFromLibrary = () => {
    const key = `${sc.id}|${sp}|${sd}`;
    if (library[sc.id]) {
      save({ ...lessons, [key]: library[sc.id] });
      setSs("📋 Library Content Pasted!");
    }
  };

  const curL = lessons[`${sc?.id}|${sp}|${sd}`] || [];
  let totalMinutes = 0;
  let lastTime = startTime;
  
  const plan = curL.map((a, i) => {
    const dur = parseInt(a.duration) || 0;
    const [h, m] = lastTime.split(":").map(Number);
    const start = lastTime;
    const date = new Date(); date.setHours(h, m + dur);
    lastTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!a.is_bonus || sc.type === "baby") totalMinutes += dur;
    return { ...a, start, end: lastTime, id: i };
  });

  const getTimelinePos = () => {
    const [h, m] = startTime.split(":").map(Number);
    const s = new Date(); s.setHours(h, m, 0);
    return ((now - s) / 60000) * 15;
  };

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436" }}>
      <style>{`
        .target-line { margin: 10px 0; padding: 10px; border-radius: 8px; font-weight: bold; line-height: 1.6; }
        .t-phrase { color: #00B894; display: block; }
        .k-phrase { color: #0984E3; display: block; margin-top: 5px; }
        .live-marker { position: absolute; left: 0; right: 0; border-top: 3px solid #FF7675; z-index: 10; transition: 1s; }
        @media print { .no-print { display: none !important; } .sheet { padding: 0 !important; box-shadow: none !important; } }
      `}</style>

      {!isLive && view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center", fontWeight:900}}>Kids&Us Audit-Ready Planner 🍎</h1>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 30, borderRadius: 25, borderBottom: `8px solid ${c.color}`, cursor: "pointer", textAlign:"center", color:"#333" }}>
                <div style={{ fontSize: 45 }}>{c.em}</div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "course" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 25 }}>
          <button onClick={() => setV("home")} style={{background:"none", border:"none", fontWeight:900, color:sc.color}}>← COURSES</button>
          <h1 style={{color:sc.color}}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 20, borderRadius: 25, marginBottom: 15, color:"#333" }}>
              <b style={{fontSize:20}}>{p}</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop:10 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 15, borderRadius: 12, border: "1px solid #EEE", background: lessons[`${sc.id}|${p}|${i+1}`] ? "#E8F5E9" : "#FFF" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isLive ? 0 : 30 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, background: isLive ? "#111" : "#fff", padding: 15, borderRadius: 15 }}>
            <button onClick={() => {setIsLive(false); setV("course")}} style={{ color: sc.color, fontWeight: 900, border: "none", background:"none" }}>← BACK</button>
            <div style={{display:"flex", gap:10}}>
              <button onClick={pasteFromLibrary} style={{background:"#f1f2f6", border:"none", borderRadius:10, padding:"0 10px"}}>📋 Paste Library</button>
              <button onClick={copyToLibrary} style={{background:"#f1f2f6", border:"none", borderRadius:10, padding:"0 10px"}}>📁 Save Library</button>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{borderRadius:8, border:"none", padding:10, fontWeight:900, background:"#EEE"}} />
              <button onClick={() => setIsLive(!isLive)} style={{ background: "#00B894", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight:800 }}>{isLive ? "EDIT" : "LIVE"}</button>
              <button onClick={() => window.print()} style={{ background: "#2D3436", color: "#fff", border: "none", borderRadius: 12, padding: "0 15px" }}>🖨️</button>
            </div>
          </div>

          <div className="sheet" style={{ background: isLive ? "#000" : "#fff", padding: isLive ? 20 : 45, borderRadius: isLive ? 0 : 35, position: "relative" }}>
            {isLive && <div className="live-marker" style={{ top: 150 + getTimelinePos() }} />}
            
            <h1 style={{color:sc.color, margin:0}}>{sc.name} - Day {sd}</h1>
            <p style={{fontWeight:900, color: totalMinutes > sc.limit ? "#D63031" : "#00B894"}}>
              TIME: {totalMinutes} / {sc.limit} min
            </p>

            {/* MATERIAL CHECKLIST */}
            {!isLive && (
              <div style={{background:"#F9F9F9", padding:20, borderRadius:20, margin:"20px 0", border:"1px solid #EEE"}}>
                <b style={{fontSize:12, color:"#AAA"}}>PREP CHECKLIST</b>
                <div style={{display:"flex", flexWrap:"wrap", gap:10, marginTop:10}}>
                  {Array.from(new Set(plan.map(a => a.materials).filter(m => m && !m.toLowerCase().includes("audio")).join(", ").split(", "))).map((m, i) => (
                    <label key={i} style={{fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:5}}>
                      <input type="checkbox" /> {m.trim()}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 30 }}>
              {plan.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 25, paddingBottom: 30, borderLeft: `6px solid ${sc.color}`, paddingLeft: 25, minHeight: a.duration * 15, position:"relative" }}>
                  <div style={{ minWidth: 80, fontWeight: 900, color: sc.color, fontSize: 20 }}>{a.start}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <b style={{fontSize: isLive ? 26 : 20}}>{a.name} ({a.duration}')</b>
                      {!isLive && <button onClick={() => {
                        const newL = [...curL]; newL.splice(i, 1); save({ ...lessons, [`${sc.id}|${sp}|${sd}`]: newL });
                      }} style={{border:"none", background:"none"}}>✕</button>}
                    </div>
                    {a.target && (
                      <div className="target-line" style={{ background: isLive ? "#111" : "#F8F9FA" }}>
                        {a.target.split("[K]").map((part, idx) => (
                          <span key={idx} className={idx === 0 ? "t-phrase" : "k-phrase"}>
                            {part.replace("[T]", "").trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: isLive ? 20 : 16, opacity: 0.8 }}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {!isLive && (
              <div style={{marginTop:30}}>
                <button onClick={() => fr.current.click()} style={{ width: "100%", background: "#F1F2F6", border: "2px dashed #CCC", padding: 30, borderRadius: 20, fontWeight:800 }}>📸 SCAN LESSON PAGE</button>
                <input type="file" ref={fr} style={{ display: "none" }} onChange={e => uploadToAI(e.target.files)} />
              </div>
            )}
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 20, zIndex: 1000 }}>{ss}</div>}
    </div>
  );
}
