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
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("16:30");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("k_planner_final_v1");
    if (saved) setL(JSON.parse(saved));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const saveAll = (data) => {
    setL(data);
    localStorage.setItem("k_planner_final_v1", JSON.stringify(data));
  };

  const downloadBackup = () => {
    const dataStr = JSON.stringify(lessons);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup_chiara.json`);
    link.click();
  };

  const curKey = `${sc?.id}|${sp}|${sd}`;
  const curL = lessons[curKey] || [];
  let lastTime = startTime;
  const plan = curL.map((a) => {
    const start = lastTime;
    const [h, m] = lastTime.split(":").map(Number);
    const date = new Date(); date.setHours(h, m + (parseInt(a.duration) || 0), 0);
    lastTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { ...a, start };
  });

  return (
    <div style={{ minHeight: "100vh", background: isLive ? "#000" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436", fontFamily: 'sans-serif' }}>
      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
          <h1 style={{textAlign:"center"}}>Kids&Us Planner 🎓</h1>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20}}>
            {CS.map(c => (
              <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background: "#fff", padding: 30, borderRadius: 25, borderBottom: `8px solid ${c.color}`, textAlign:"center", color: "#333" }}>
                <div style={{ fontSize: 45 }}>{c.em}</div>
                <b>{c.name}</b>
              </div>
            ))}
          </div>
          <button onClick={downloadBackup} style={{marginTop: 40, width: "100%", padding: 15, borderRadius: 15, background: "#2980B9", color: "white", border: "none"}}>📥 SCARICA BACKUP LEZIONI</button>
        </div>
      )}

      {view === "course" && (
        <div style={{ maxWidth: 650, margin: "0 auto", padding: 25 }}>
          <button onClick={() => setV("home")}>← BACK</button>
          <h1 style={{color:sc.color}}>{sc.name}</h1>
          {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
            <div key={p} style={{ background: "#fff", padding: 20, borderRadius: 25, marginBottom: 15, color: "#333" }}>
              <b>{p}</b>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop:10 }}>
                {[...Array(10)].map((_, i) => (
                  <button key={i} onClick={() => { setSp(p); setSd(i+1); setV("lesson"); }} style={{ padding: 15, background: lessons[`${sc.id}|${p}|${i+1}`] ? "#E8F5E9" : "#FFF" }}>{i+1}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "lesson" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 30 }}>
          <button onClick={() => setV("course")}>← EXIT</button>
          <div style={{ background: "#fff", padding: 40, borderRadius: 30, marginTop: 20, color: "#333" }}>
            <h1>{sc.name} - Day {sd}</h1>
            {plan.length > 0 ? plan.map((a, i) => (
              <div key={i} style={{ marginBottom: 30, borderLeft: `5px solid ${sc.color}`, paddingLeft: 20 }}>
                <b style={{color: sc.color}}>{a.start} - {a.name}</b>
                <p>{a.desc}</p>
                {a.audio && <small>🎵 {a.audio}</small>}
              </div>
            )) : (
              <input type="file" onChange={async (e) => {
                const formData = new FormData(); formData.append("file", e.target.files[0]);
                formData.append("course", sc.name); formData.append("day", sd);
                const res = await fetch("https://kids-us-planner-new.onrender.com/upload", { method: "POST", body: formData });
                const data = await res.json();
                saveAll({ ...lessons, [curKey]: data.activities });
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
