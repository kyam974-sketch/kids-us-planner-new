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

  // FUNZIONE MAGICA: Rimpicciolisce l'immagine per non far crashare Vercel
  const compressImage = async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Ridimensioniamo a 1200px
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]); // Qualità 60% per essere leggeri
      };
    });
  };

  const processFile = async (file, type) => {
    setScn(true);
    setSs("Compressione e invio...");
    try {
      let base64 = await new Promise(r => {
        const rd = new FileReader();
        rd.onload = () => r(rd.result.split(',')[1]);
        rd.readAsDataURL(file);
      });

      // Se è un'immagine, la comprimiamo
      if (file.type.includes("image")) {
        base64 = await compressImage(base64);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          messages: [{
            role: "user",
            content: [
              { type: file.type === "application/pdf" ? "document" : "image", source: { type: "base64", media_type: file.type === "application/pdf" ? "application/pdf" : "image/jpeg", data: base64 } },
              { type: "text", text: `Analizza questa pagina Kids&Us. ATTENZIONE: il testo è su DUE COLONNE, leggile separatamente. 
                ${type === 'r' ? "Estrai Version A e Version B delle routine." : "Estrai le attività dal punto 2 in poi."}
                Rispondi SOLO in JSON: 
                ${type === 'r' ? "{'a': [{'name','duration','desc'}], 'b': [{'name','duration','desc'}]}" : "[{'name','duration','desc','target'}]"}` 
              }
            ]
          }]
        })
      });

      const d = await res.json();
      const txt = d.content[0].text;
      const parsed = JSON.parse(txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);

      if (type === "r") {
        const newR = { ...routines, [`${sc.id}|${sp}`]: parsed };
        setR(newR);
        localStorage.setItem("k_r", JSON.stringify(newR));
        setSs("Routines salvate!");
      } else {
        const key = `${sc.id}|${sp}|${sd}`;
        const newL = { ...lessons, [key]: parsed };
        setL(newL);
        localStorage.setItem("k_l", JSON.stringify(newL));
        setSs("Lezione pronta!");
      }
    } catch (e) {
      setSs("Errore. Prova uno screenshot.");
    }
    setTimeout(() => setScn(false), 2000);
  };

  const curR = routines[`${sc?.id}|${sp}`];
  const ver = localStorage.getItem(`v|${sc?.id}|${sp}`) || "a";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#FAFAF7", padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 900, marginBottom: 20, color: "#3C3C3B" }}>Kids&Us Planner 👋</h2>
          {CS.map(c => (
            <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: `6px solid ${c.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: 32 }}>{c.em}</span>
              <b style={{ fontSize: 20 }}>{c.name}</b>
            </div>
          ))}
        </div>
      )}

      {view === "course" && sc && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← HOME</button>
          <h1 style={{ color: sc.color, fontWeight: 900, fontSize: 28, marginBottom: 20 }}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 15, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ color: "#3C3C3B" }}>{p}</b>
                <button onClick={() => { setSp(p); fr.current.click(); }} style={{ fontSize: 11, background: routines[`${sc.id}|${p}`] ? "#E8F5E9" : "#f0f0f0", color: routines[`${sc.id}|${p}`] ? "#2E7D32" : "#888", padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 800 }}>
                  {routines[`${sc.id}|${p}`] ? "✅ Routine OK" : "📸 Carica Routine"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding: 12, borderRadius: 10, border: "1px solid #eee", background: "#fdfdfd", fontWeight: 800, color: "#3C3C3B" }}>{i + 1}</button>
                ))}
              </div>
            </div>
          ))}
          <input type="file" ref={fr} style={{ display: "none" }} onChange={e => processFile(e.target.files[0], "r")} />
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("course")} style={{ marginBottom: 20, border: "none", background: "none", fontWeight: 800, color: sc.color }}>← {sp}</button>
          <div style={{ background: "#fff", padding: 25, borderRadius: 24, border: "1px solid #eee", marginBottom: 20, textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
             <h3 style={{ fontWeight: 900, color: sc.color, fontSize: 22 }}>Day {sd}</h3>
             <div style={{ display: "flex", gap: 8, margin: "15px 0" }}>
                {["a", "b"].map(v => (
                  <button key={v} onClick={() => { localStorage.setItem(`v|${sc.id}|${sp}`, v); setSs(v); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: ver === v ? "#3C3C3B" : "#eee", color: ver === v ? "#fff" : "#888", fontWeight: 800 }}>Version {v.toUpperCase()}</button>
                ))}
             </div>
             <button onClick={() => fr.current.click()} style={{ width: "100%", background: sc.color, color: "#fff", padding: "16px", borderRadius: 16, border: "none", fontWeight: 800, fontSize: 15 }}>📸 SCANSIONA LEZIONE</button>
             <input type="file" ref={fr} style={{ display: "none" }} onChange={e => processFile(e.target.files[0], "l")} />
          </div>

          <div style={{ marginTop: 20 }}>
            {curR && curR[ver] && curR[ver].map((r, idx) => (
              <div key={idx} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: "6px solid #3C3C3B", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{r.name}</b> <span style={{color:"#888"}}>{r.duration}'</span></div>
                <p style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: "1.5" }}>{r.desc}</p>
              </div>
            ))}
            {lessons[`${sc.id}|${sp}|${sd}`]?.map((a, i) => (
              <div key={i} style={{ background: "#fff", padding: 20, marginBottom: 12, borderRadius: 18, borderLeft: `6px solid ${sc.color}`, boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>{a.name}</b> <span style={{color:sc.color, fontWeight:800}}>{a.duration}'</span></div>
                <p style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: "1.5" }}>{a.desc}</p>
                {a.target && <div style={{ marginTop: 12, padding: 10, background: "#FFFDE7", borderRadius: 10, fontSize: 12, borderLeft: "3px solid #FFD600" }}><b>Target Language:</b> {a.target}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {scn && <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#3C3C3B", color: "#fff", padding: "14px 28px", borderRadius: 50, zIndex: 2000, fontWeight: 800, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>{ss}</div>}
    </div>
  );
}
