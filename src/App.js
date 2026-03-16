import React, { useState, useRef, useEffect } from "react";

// --- CONFIGURAZIONE PRIVACY ---
const APP_PASSWORD = "Chiara2024"; // <--- CAMBIA QUESTA PASSWORD COME PREFERISCI

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

  // Caricamento dati iniziali
  useEffect(() => {
    const saved = localStorage.getItem("k_planner_data_v9");
    if (saved) setL(JSON.parse(saved));
    
    const auth = sessionStorage.getItem("k_auth");
    if (auth === "true") setIsAuthorized(true);

    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Salvataggio automatico
  const saveAll = (data) => {
    setL(data);
    localStorage.setItem("k_planner_data_v9", JSON.stringify(data));
  };

  // --- FUNZIONI BACKUP ---
  const downloadBackup = () => {
    const dataStr = JSON.stringify(lessons);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup_planner_${new Date().toISOString().slice(0,10)}.json`;
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importBackup = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      const json = JSON.parse(e.target.result);
      saveAll(json);
      alert("Backup ripristinato con successo!");
    };
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === APP_PASSWORD) {
      setIsAuthorized(true);
      sessionStorage.setItem("k_auth", "true");
    } else {
      alert("Password errata!");
    }
  };

  // Logica calcolo piano (omessa per brevità ma identica alla tua versione funzionante)
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

  // --- SCHERMATA LOGIN ---
  if (!isAuthorized) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F4F7F6" }}>
        <form onSubmit={handleLogin} style={{ background: "white", padding: 40, borderRadius: 30, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
          <h2 style={{ marginBottom: 20 }}>Kids&Us Planner 🔒</h2>
          <input 
            type="password" 
            placeholder="Inserisci Password" 
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            style={{ padding: 15, borderRadius: 15, border: "2px solid #EEE", width: "100%", fontSize: 18, marginBottom: 20 }}
          />
          <button type="submit" style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: "#F26522", color: "white", fontWeight: "bold", fontSize: 18 }}>ACCEDI</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436", fontFamily: 'sans-serif' }}>
      {/* VISTA HOME */}
      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center", fontWeight:900, marginBottom: 40}}>Kids&Us Master Planner 🎓</h1>
          
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 30, borderRadius: 25, borderBottom: `8px solid ${c.color}`, cursor: "pointer", textAlign:"center", color: "#333" }}>
                <div style={{ fontSize: 45 }}>{c.em}</div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>

          {/* SEZIONE BACKUP IN HOME */}
          <div style={{ marginTop: 60, padding: 20, borderTop: "2px dashed #CCC", textAlign: "center" }}>
            <h3>Gestione Dati 💾</h3>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={downloadBackup} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "#2980B9", color: "white", fontWeight: "bold" }}>📥 Scarica Backup</button>
              <label style={{ padding: "10px 20px", borderRadius: 12, background: "#27AE60", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                📤 Ripristina Backup
                <input type="file" onChange={importBackup} style={{ display: "none" }} />
              </label>
            </div>
            <p style={{ fontSize: 12, color: "#666", marginTop: 10 }}>Scarica il backup prima di aggiornamenti importanti per non perdere le lezioni.</p>
          </div>
        </div>
      )}

      {/* Qui andrebbe il resto del codice view="course" e view="lesson" (che hai già) */}
      {/* Assicurati di includere le modifiche fatte prima per la linea del tempo! */}
      
      {view === "course" && ( /* ... tuo codice course ... */ null )}
      {view === "lesson" && ( /* ... tuo codice lesson ... */ null )}

    </div>
  );
}
