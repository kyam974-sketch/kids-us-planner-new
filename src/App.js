import React, { useState, useEffect } from "react";

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
  const [startTime, setStartTime] = useState("16:30");

  useEffect(() => {
    const saved = localStorage.getItem("k_planner_audit_version");
    if (saved) setL(JSON.parse(saved));
  }, []);

  const saveAll = (data) => {
    setL(data);
    localStorage.setItem("k_planner_audit_version", JSON.stringify(data));
  };

  const curKey = `${sc?.id}|${sp}|${sd}`;
  const curL = lessons[curKey] || [];
  let lastTime = startTime;
  const plan = curL.map((a) => {
    const start = lastTime;
    const [h, m] = lastTime.split(":").map(Number);
    const d = new Date(); d.setHours(h, m + (parseInt(a.duration) || 0), 0);
    lastTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { ...a, start };
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F6", fontFamily: 'sans-serif', padding: 20 }}>
      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{textAlign:"center"}}>Kids&Us Planner 🎓</h1>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 20, borderRadius: 20, borderBottom: `5px solid ${c.color}`, textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize: 40 }}>{c.em}</div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "course" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setV("home")}>← Indietro</button>
          <h1 style={{color:sc.color}}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 15, borderRadius: 15, marginBottom: 10 }}>
              <b>{p}</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginTop:10 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 10, background: lessons[`${sc.id}|${p}|${i+1}`] ? "#E8F5E9" : "#FFF" }}>{i+1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button onClick={() => setV("course")}>← Esci</button>
          <div style={{ background: "#fff", padding: 30, borderRadius: 25, marginTop: 20 }}>
            <h1>{sc.name} - Day {sd}</h1>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <div style={{ marginTop: 20 }}>
              {plan.length > 0 ? plan.map((a, i) => (
                <div key={i} style={{ marginBottom: 20, paddingLeft: 15, borderLeft: `4px solid ${sc.color}` }}>
                  <b>{a.start} - {a.name}</b>
                  <p style={{margin: "5px 0"}}>{a.desc}</p>
                  {a.audio && <small style={{background:"#FFF9C4"}}>🎵 {a.audio}</small>}
                </div>
              )) : (
                <div style={{padding: 20, border: "2px dashed #ccc", textAlign: "center"}}>
                  <p>Carica la lezione:</p>
                  <input type="file" onChange={async (e) => {
                    const fd = new FormData(); fd.append("file", e.target.files[0]);
                    fd.append("course", sc.name); fd.append("day", sd);
                    const res = await fetch("https://kids-us-planner-new.onrender.com/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    saveAll({ ...lessons, [curKey]: data.activities });
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
