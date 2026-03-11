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
  const [scn, setScn] = useState(false);
  const [ss, setSs] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("16:30");
  const [currentTime, setCurrentTime] = useState(new Date());
  const fr = useRef(null);

  useEffect(() => {
    const l = localStorage.getItem("k_l_v2");
    if (l) setL(JSON.parse(l));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const save = (newL) => {
    setL(newL);
    localStorage.setItem("k_l_v2", JSON.stringify(newL));
  };

  const uploadToAI = async (files) => {
    setScn(true); setSs("AI Analyzing Files (English Only)...");
    try {
      const parts = await Promise.all(Array.from(files).map(async f => {
        const b64 = await new Promise(r => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result.split(',')[1]);
          rd.readAsDataURL(f);
        });
        return { inlineData: { data: b64, mimeType: f.type || "image/jpeg" } };
      }));

      const promptMsg = `Analyze these Kids&Us lesson/routine pages. 
      1. Use ONLY English. 
      2. Extract all activities (Routine, Main, Bonus). 
      3. For 'target', use a theater script style (e.g., Teacher: '...' / Kids: '...'). 
      4. If an activity is 'Bonus' or 'Optional', set is_bonus: true.
      5. Do not include 'Audio tracks' in materials.
      Return ONLY JSON: [{"name","duration","desc","target","materials","is_bonus"}]`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageB64: parts[0].inlineData.data, mimeType: parts[0].inlineData.mimeType, prompt: promptMsg }) 
      });

      const d = await res.json();
      const cleanText = d.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      save({ ...lessons, [`${sc.id}|${sp}|${sd}`]: parsed });
      setSs("✅ Lesson Updated!");
    } catch (e) { setSs(`❌ Error: ${e.message}`); }
    setTimeout(() => setScn(false), 3000);
  };

  const addActivity = () => {
    const key = `${sc.id}|${sp}|${sd}`;
    const newL = [...(lessons[key] || []), { name: "New Activity", duration: 5, desc: "", target: "", materials: "", is_bonus: false }];
    save({ ...lessons, [key]: newL });
  };

  const deleteAct = (idx) => {
    const key = `${sc.id}|${sp}|${sd}`;
    const newL = [...(lessons[key] || [])];
    newL.splice(idx, 1);
    save({ ...lessons, [key]: newL });
  };

  const clearDay = () => {
    if(window.confirm("Clear all data for this day?")) {
      const newL = {...lessons};
      delete newL[`${sc.id}|${sp}|${sd}`];
      save(newL);
    }
  };

  const curL = lessons[`${sc?.id}|${sp}|${sd}`] || [];
  const normalActs = curL.filter(a => !a.is_bonus || sc.type === "baby");
  const bonusActs = curL.filter(a => a.is_bonus && sc.type !== "baby");

  let totalMinutes = 0;
  let lastTime = startTime;
  const planWithTimes = normalActs.map((act, i) => {
    const dur = parseInt(act.duration) || 0;
    const [h, m] = lastTime.split(":").map(Number);
    const startStr = lastTime;
    const startDate = new Date(); startDate.setHours(h, m, 0);
    const endDate = new Date(startDate.getTime() + dur * 60000);
    lastTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    totalMinutes += dur;
    return { ...act, start: startStr, end: lastTime, startTimeObj: startDate, endTimeObj: endDate };
  });

  const getTimelinePos = () => {
    if (!isLive) return -1;
    const [h, m] = startTime.split(":").map(Number);
    const s = new Date(); s.setHours(h, m, 0);
    const diff = (currentTime - s) / 60000;
    return diff * 15; // 15px per minute
  };

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F8F9FA", color: isLive ? "#FFF" : "#333", fontFamily: 'Inter, system-ui' }}>
      <style>{`
        .live-line { position: absolute; left: 0; right: 0; border-top: 3px solid #FF4757; z-index: 100; pointer-events: none; transition: top 1s linear; }
        .live-line::after { content: 'NOW'; position: absolute; right: 10px; top: -12px; background: #FF4757; color: white; font-size: 10px; padding: 2px 5px; border-radius: 4px; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {!isLive && view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center", fontWeight:900}}>Kids&Us Planner 🍎</h1>
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
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <button onClick={() => setV("home")} style={{background:"none", border:"none", fontWeight:900, color:sc.color}}>← BACK</button>
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
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isLive ? 0 : 25 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, background: isLive ? "#111" : "#fff", padding: 15, borderRadius: 15 }}>
            <button onClick={() => {setIsLive(false); setV("course")}} style={{ color: sc.color, fontWeight: 900, border: "none", background:"none" }}>← EXIT</button>
            <div style={{display:"flex", gap:10}}>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{borderRadius:8, border:"none", padding:5, fontWeight:900}} />
              <button onClick={() => setIsLive(!isLive)} style={{ background: "#2ED573", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight:800 }}>{isLive ? "EDIT MODE" : "GO LIVE ▶️"}</button>
              {!isLive && <button onClick={clearDay} style={{ background: "#FF4757", color: "#fff", border: "none", borderRadius: 12, padding: "0 15px" }}>🗑️</button>}
            </div>
          </div>

          <div style={{ background: isLive ? "#000" : "#fff", padding: isLive ? 20 : 40, borderRadius: isLive ? 0 : 30, position: "relative" }}>
            {isLive && <div className="live-line" style={{ top: 120 + getTimelinePos() }} />}
            
            <h1 style={{color:sc.color, margin:0}}>{sc.name} - Day {sd}</h1>
            <p style={{opacity:0.5}}>{totalMinutes} / {sc.limit} min</p>

            <div style={{ marginTop: 30 }}>
              {planWithTimes.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 20, marginBottom: 0, paddingBottom: 20, borderLeft: `5px solid ${sc.color}`, paddingLeft: 20, minHeight: a.duration * 15 }}>
                  <div style={{ minWidth: 70, fontWeight: 900, color: sc.color }}>{a.start}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <b style={{fontSize: isLive ? 24 : 18}}>{a.name} ({a.duration}')</b>
                      {!isLive && <button onClick={() => deleteAct(i)} style={{border:"none", background:"none"}}>✕</button>}
                    </div>
                    {a.target && <div style={{ background: isLive ? "#1A1A1A" : "#F1F2F6", padding: 10, borderRadius: 10, margin: "10px 0", fontStyle:"italic", color: isLive ? "#2ED573" : "#333" }}>{a.target}</div>}
                    <p style={{ opacity: 0.8, fontSize: isLive ? 18 : 15 }}>{a.desc}</p>
                    {a.materials && <small style={{opacity:0.5}}>🛠️ {a.materials}</small>}
                  </div>
                </div>
              ))}
            </div>

            {bonusActs.length > 0 && (
              <div style={{marginTop:40, padding:25, background: isLive ? "#111" : "#FFF9DB", borderRadius:25, border: "2px dashed #FAB005"}}>
                <b style={{color:"#FAB005"}}>⭐ BONUS ACTIVITIES</b>
                {bonusActs.map((b, i) => (
                  <div key={i} style={{marginTop:15}}>
                    <b>{b.name}</b>
                    <p style={{fontSize:14}}>{b.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {!isLive && (
              <div style={{marginTop:30, display:"flex", gap:10}}>
                <button onClick={() => fr.current.click()} style={{ flex: 2, background: "#F1F2F6", border: "2px dashed #CCC", padding: 20, borderRadius: 15, fontWeight:800 }}>📸 UPLOAD PDF/PHOTOS (SELECT MULTIPLE)</button>
                <button onClick={addActivity} style={{ flex: 1, background: sc.color, color: "#fff", border: "none", borderRadius: 15, fontSize: 30 }}>+</button>
                <input type="file" ref={fr} multiple style={{ display: "none" }} onChange={e => uploadToAI(e.target.files)} />
              </div>
            )}
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 20, zIndex: 1000 }}>{ss}</div>}
    </div>
  );
}
