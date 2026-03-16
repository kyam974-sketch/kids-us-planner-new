import React, { useState, useRef, useEffect } from "react";

// --- CONFIGURAZIONE PRIVACY ---
const APP_PASSWORD = "Chiara2024"; 

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [view, setV] = useState("home");
  const [sc, setSc] = useState(null);
  const [sp, setSp] = useState("");
  const [sd, setSd] = useState(null);
  const [lessons, setL] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("16:30");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("k_planner_data_v12");
    if (saved) setL(JSON.parse(saved));
    const auth = sessionStorage.getItem("k_auth");
    if (auth === "true") setIsAuthorized(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const saveAll = (data) => {
    setL(data);
    localStorage.setItem("k_planner_data_v12", JSON.stringify(data));
  };

  const downloadBackup = () => {
    const dataStr = JSON.stringify(lessons);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup_planner_${new Date().toISOString().slice(0,10)}.json`);
    link.click();
  };

  const importBackup = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        saveAll(json);
        alert("Backup ripristinato!");
      } catch (err) { alert("File non valido"); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === APP_PASSWORD) {
      setIsAuthorized(true);
      sessionStorage.setItem("k_auth", "true");
    } else { alert("Password errata!"); }
  };

  const curKey = `${sc?.id}|${sp}|${sd}`;
  const curL = lessons[curKey] || [];
  let totalMinutes = 0;
  let lastTime = startTime;
  
  const plan = curL.map((a, i) => {
    const dur = parseInt(a.duration) || 0;
    const start = lastTime;
    const [h, m] = lastTime.split(":").map(Number);
    const date = new Date(); date.setHours(h, m + dur, 0);
    lastTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    totalMinutes += dur;
    return { ...a, start, id: i };
  });

  const getMarkerTop = () => {
    const [sh, sm] = startTime.split(":").map(Number);
    const sObj = new Date(now); sObj.setHours(sh, sm, 0);
    const diff = (now - sObj) / 60000;
    return diff < 0 ? -100 : 180 + (diff * 18.2);
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F4F7F6" }}>
        <form onSubmit={handleLogin} style={{ background: "white", padding: 40, borderRadius: 30, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
          <h2 style={{ marginBottom: 20 }}>Kids&Us Planner 🔒</h2>
          <input type="password" placeholder="Password" value={passInput} onChange={e => setPassInput(e.target.value)} style={{ padding: 15, borderRadius: 15, border: "2px solid #EEE", width: "100%", marginBottom: 20, fontSize: 18 }} />
          <button type="submit" style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: "#F26522", color: "white", fontWeight: "bold", fontSize: 18 }}>ACCEDI</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436", fontFamily: 'sans-serif' }}>
      <style>{`
        .t-phrase { color: #27AE60; display: block; }
        .k-phrase { color: #2980B9; display: block; margin-top: 4px; }
        .marker { position: absolute; left: 0; right: 0; border-top: 4px solid #FF3B30; z-index: 999; transition: top 1s linear; }
        .marker::after { content: '${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}'; position: absolute; right: 10px; top: -22px; background: #FF3B30; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      `}</style>

      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center", fontWeight:900}}>Kids&Us Master Planner 🎓</h1>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 30, borderRadius: 25, borderBottom: `8px solid ${c.color}`, cursor: "pointer", textAlign:"center", color: "#333" }}>
                <div style={{ fontSize: 45 }}>{c.em}</div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 60, padding: 20, borderTop: "2px dashed #CCC", textAlign: "center" }}>
            <h3>Gestione Dati 💾</h3>
            <button onClick={downloadBackup} style={{ padding: "10px 20px", borderRadius: 12, background: "#2980B9", color: "#fff", border: "none", marginRight: 10 }}>📥 Backup</button>
            <label style={{ padding: "10px 20px", borderRadius: 12, background: "#27AE60", color: "#fff", cursor: "pointer" }}>📤 Ripristina <input type="file" onChange={importBackup} style={{display:"none"}}/></label>
          </div>
        </div>
      )}

      {view === "course" && (
        <div style={{ maxWidth: 650, margin: "0 auto", padding: 25 }}>
          <button onClick={() => setV("home")} style={{background:"none", border:"none", fontWeight:900, color:sc.color}}>← BACK</button>
          <h1 style={{color:sc.color}}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 20, borderRadius: 25, marginBottom: 15, color:"#333" }}>
              <b>{p}</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop:10 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 15, borderRadius: 12, border: "1px solid #EEE", background: lessons[`${sc.id}|${p}|${i+1}`] ? "#E8F5E9" : "#FFF", fontWeight: 700 }}>{i+1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isLive ? 0 : 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, background: isLive ? "#111" : "#fff", padding: 15, borderRadius: 20 }}>
            <button onClick={() => {setIsLive(false); setV("course")}} style={{ color: sc.color, fontWeight: 900, border: "none", background:"none" }}>← EXIT</button>
            <div style={{display:"flex", gap:10}}>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{borderRadius:8, border:"none", padding:10, fontWeight:900, background:"#F1F2F6"}} />
              <button onClick={() => setIsLive(!isLive)} style={{ background: "#27AE60", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight:800 }}>{isLive ? "EDIT" : "LIVE ▶️"}</button>
            </div>
          </div>

          <div style={{ background: isLive ? "#000" : "#fff", padding: isLive ? "100px 20px 400px 20px" : 45, borderRadius: isLive ? 0 : 35, position: "relative", minHeight: "2500px" }}>
            {isLive && <div className="marker" style={{ top: getMarkerTop() }} />}
            <h1 style={{color:sc.color, margin:0}}>{sc.name} - Day {sd}</h1>
            <div style={{fontWeight:900, color: totalMinutes > sc.limit ? "#D63031" : "#00B894"}}>TOTAL: {totalMinutes} / {sc.limit} min</div>

            <div style={{ marginTop: 40 }}>
              {plan.length > 0 ? plan.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 30, paddingBottom: 60, borderLeft: `8px solid ${sc.color}`, paddingLeft: 30, position:"relative" }}>
                  <div style={{ minWidth: 90, fontWeight: 900, color: sc.color, fontSize: 22 }}>{a.start}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{fontSize: 24}}>{a.name}</b>
                    {a.audio && <div style={{background: "#FBC02D", color: "#000", padding: "2px 8px", borderRadius: 5, fontSize: 13, fontWeight: 900, margin: "5px 0", display:"inline-block"}}>🎵 {a.audio}</div>}
                    {a.target && (
                      <div style={{ background: isLive ? "#111" : "#F1F2F6", padding:12, borderRadius:10, margin:"10px 0", fontWeight:700 }}>
                        {a.target.split("[K]").map((p, idx) => <span key={idx} className={idx===0?"t-phrase":"k-phrase"}>{p.replace("[T]","").trim()}</span>)}
                      </div>
                    )}
                    <p style={{ fontSize: 18, margin: "10px 0" }}>{a.desc}</p>
                    <div style={{fontSize:12, fontWeight:700, color: sc.color}}>🛠️ {a.materials}</div>
                  </div>
                </div>
              )) : (
                <div style={{textAlign:"center", padding: 40, border: "2px dashed #EEE", borderRadius: 20}}>
                  <p>Nessun dato. Carica il PDF o uno screenshot della lezione:</p>
                  <input type="file" onChange={async (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    const formData = new FormData(); formData.append("file", file);
                    formData.append("course", sc.name); formData.append("day", sd);
                    try {
                      // USIAMO L'INDIRIZZO NUOVO CHE FUNZIONA
                      const res = await fetch("https://kids-us-planner-new.onrender.com/upload", { 
                        method: "POST", 
                        body: formData 
                      });
                      if (!res.ok) throw new Error("Server error");
                      const data = await res.json();
                      saveAll({ ...lessons, [curKey]: data.activities });
                    } catch (err) { alert("Errore caricamento. Riprova con uno screenshot se il PDF è pesante."); }
                  }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
