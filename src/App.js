import React, { useState, useRef, useEffect } from “react”;
import { createClient } from “@supabase/supabase-js”;

const SUPABASE_URL = “https://zuaalqhbesywmfvuvgho.supabase.co”;
const SUPABASE_ANON_KEY = “eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWFscWhiZXN5d21mdnV2Z2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODM1OTksImV4cCI6MjA4OTM1OTU5OX0.9drUMBRWudHc_jh3n0pJaybr2qKZUCQvAezuGzb2pGI”;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CS = [
{id:“mousy”,name:“Mousy”,color:”#8CB43B”,em:”\u{1F42D}”,type:“baby”, limit:45},
{id:“linda”,name:“Linda”,color:”#F26522”,em:”\u{1F431}”,type:“baby”, limit:45},
{id:“sam”,name:“Sam”,color:”#00B3B0”,em:”\u{1F9F8}”,type:“kids”, limit:60},
{id:“emma”,name:“Emma”,color:”#E878A0”,em:”\u{1F98B}”,type:“kids”, limit:60},
{id:“oliver”,name:“Oliver”,color:”#00B3B0”,em:”\u{1F438}”,type:“kids”, limit:60},
{id:“marcia”,name:“Marcia”,color:”#E94E58”,em:”\u{1F380}”,type:“kids”, limit:60},
{id:“pam”,name:“Pam & Paul”,color:”#FFD700”,em:”\u{1F46B}”,type:“kids”, limit:60},
{id:“ben”,name:“Ben & Brenda”,color:”#4B0082”,em:”\u{1F9D1}”,type:“teens”, limit:90}
];

function LoginScreen() {
const [email, setEmail] = useState(””);
const [password, setPassword] = useState(””);
const [error, setError] = useState(””);
const [loading, setLoading] = useState(false);

const handleLogin = async () => {
setLoading(true);
setError(””);
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setError(“❌ “ + error.message);
setLoading(false);
};

return (
<div style={{ minHeight:“100vh”, background:”#F4F7F6”, display:“flex”, alignItems:“center”, justifyContent:“center”, fontFamily:“sans-serif” }}>
<div style={{ background:”#fff”, padding:50, borderRadius:30, boxShadow:“0 10px 40px rgba(0,0,0,0.1)”, width:340, textAlign:“center” }}>
<div style={{ fontSize:60, marginBottom:10 }}>🎓</div>
<h2 style={{ fontWeight:900, marginBottom:30 }}>Kids&Us Planner</h2>
<input
type=“email”
placeholder=“Email”
value={email}
onChange={e => setEmail(e.target.value)}
style={{ width:“100%”, padding:“12px 15px”, borderRadius:12, border:“1px solid #DDD”, fontSize:15, marginBottom:12, boxSizing:“border-box” }}
/>
<input
type=“password”
placeholder=“Password”
value={password}
onChange={e => setPassword(e.target.value)}
onKeyDown={e => e.key === “Enter” && handleLogin()}
style={{ width:“100%”, padding:“12px 15px”, borderRadius:12, border:“1px solid #DDD”, fontSize:15, marginBottom:20, boxSizing:“border-box” }}
/>
{error && <div style={{ color:”#D63031”, fontSize:13, marginBottom:12 }}>{error}</div>}
<button
onClick={handleLogin}
disabled={loading}
style={{ width:“100%”, padding:“14px”, background:”#8CB43B”, color:”#fff”, border:“none”, borderRadius:12, fontWeight:900, fontSize:16, cursor:“pointer” }}
>
{loading ? “…” : “ACCEDI”}
</button>
</div>
</div>
);
}

export default function App() {
const [session, setSession] = useState(null);
const [authChecked, setAuthChecked] = useState(false);
const [view, setV] = useState(“home”);
const [sc, setSc] = useState(null);
const [sp, setSp] = useState(””);
const [sd, setSd] = useState(null);
const [lessons, setL] = useState({});
const [history, setHistory] = useState([]);
const [clipboard, setClipboard] = useState(null);
const [scn, setScn] = useState(false);
const [ss, setSs] = useState(””);
const [isLive, setIsLive] = useState(false);
const [startTime, setStartTime] = useState(“16:30”);
const [now, setNow] = useState(new Date());
const [syncing, setSyncing] = useState(false);
const fr = useRef(null);
const importRef = useRef(null);

useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => {
setSession(session);
setAuthChecked(true);
});
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
setSession(session);
});
return () => subscription.unsubscribe();
}, []);

useEffect(() => {
if (!session) return;
const loadLessons = async () => {
const { data, error } = await supabase.from(“lessons”).select(“key, data”);
if (error) { console.error(error); return; }
const merged = {};
data.forEach(row => { merged[row.key] = row.data; });
setL(merged);
};
loadLessons();
const t = setInterval(() => setNow(new Date()), 1000);
return () => clearInterval(t);
}, [session]);

const saveState = async (newL) => {
setHistory(h => […h, lessons]);
setL(newL);
const changedKeys = Object.keys(newL).filter(k => JSON.stringify(newL[k]) !== JSON.stringify(lessons[k]));
for (const key of changedKeys) {
await supabase.from(“lessons”).upsert(
{ user_id: session.user.id, key, data: newL[key] },
{ onConflict: “user_id,key” }
);
}
};

const undo = () => {
if (history.length > 0) {
setL(history[history.length - 1]);
setHistory(h => h.slice(0, -1));
setSs(“⏪ Undo!”);
}
};

const exportBackup = () => {
const blob = new Blob([JSON.stringify(lessons, null, 2)], { type: “application/json” });
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url;
a.download = “kids-us-backup-” + new Date().toISOString().slice(0,10) + “.json”;
a.click();
URL.revokeObjectURL(url);
setSs(“💾 Backup exported!”);
setScn(true);
setTimeout(() => setScn(false), 3000);
};

const importBackup = async (file) => {
const reader = new FileReader();
reader.onload = async (e) => {
try {
const parsed = JSON.parse(e.target.result);
setSyncing(true);
for (const key of Object.keys(parsed)) {
await supabase.from(“lessons”).upsert(
{ user_id: session.user.id, key, data: parsed[key] },
{ onConflict: “user_id,key” }
);
}
setL(parsed);
setSyncing(false);
setSs(“✅ Backup restored!”);
setScn(true);
setTimeout(() => setScn(false), 3000);
} catch (err) {
setSyncing(false);
setSs(“❌ Invalid file.”);
setScn(true);
setTimeout(() => setScn(false), 3000);
}
};
reader.readAsText(file);
};

const handleLogout = async () => {
await supabase.auth.signOut();
setL({});
setV(“home”);
};

const uploadToAI = async (files) => {
setScn(true);
setSs(“Scanning: Verbatim Audio & Target…”);
try {
const b64 = await new Promise(r => {
const rd = new FileReader();
rd.onload = () => r(rd.result.split(”,”)[1]);
rd.readAsDataURL(files[0]);
});
const promptMsg = “Extract Kids&Us lesson. Use ONLY English. CRITICAL: Find Track # or Audio and put it in audio field for THAT activity. Target Language: Verbatim copy. Use [T] for Teacher, [K] for Kids. If Bonus/Optional, set is_bonus: true. JSON: [{"name","duration","audio","desc","target","materials","is_bonus"}]”;
const res = await fetch(”/api/generate”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({ imageB64: b64, mimeType: files[0].type || “image/jpeg”, prompt: promptMsg })
});
const d = await res.json();
const cleanText = d.text.replace(/`json|`/g, “”).trim();
const parsed = JSON.parse(cleanText.match(/{[\s\S]*}|[[\s\S]*]/)[0]);
saveState({ …lessons, [sc.id + “|” + sp + “|” + sd]: parsed });
setSs(“✅ Activities & Audio Synced!”);
} catch (e) {
setSs(“❌ Error: “ + e.message);
}
setTimeout(() => setScn(false), 3000);
};

const addActivity = (item) => {
const key = sc.id + “|” + sp + “|” + sd;
const newAct = item ? {…item} : { name: “New”, duration: 5, audio: “”, desc: “”, target: “[T] … [K] …”, materials: “”, is_bonus: false };
saveState({ …lessons, [key]: […(lessons[key] || []), newAct] });
};

const updateAct = (idx, field, val) => {
const key = sc.id + “|” + sp + “|” + sd;
const newL = […(lessons[key] || [])];
newL[idx][field] = val;
saveState({ …lessons, [key]: newL });
};

const curL = lessons[sc?.id + “|” + sp + “|” + sd] || [];
const normalActs = curL.filter(a => !a.is_bonus || sc.type === “baby”);
const bonusActs = curL.filter(a => a.is_bonus && sc.type !== “baby”);

let totalMinutes = 0;
let lastTime = startTime;
const plan = normalActs.map((a, i) => {
const dur = parseInt(a.duration) || 0;
const [h, m] = lastTime.split(”:”).map(Number);
const start = lastTime;
const date = new Date();
date.setHours(h, m + dur);
lastTime = date.toLocaleTimeString([], { hour: “2-digit”, minute: “2-digit” });
totalMinutes += dur;
return { …a, start, end: lastTime, id: i };
});

if (!authChecked) return (
<div style={{ minHeight:“100vh”, background:”#F4F7F6”, display:“flex”, alignItems:“center”, justifyContent:“center”, fontFamily:“sans-serif” }}>
<div style={{ fontSize:40 }}>⏳</div>
</div>
);

if (!session) return <LoginScreen />;

return (
<div style={{ minHeight:“100vh”, background: isLive ? “#000” : “#F4F7F6”, color: isLive ? “#FFF” : “#2D3436”, fontFamily:“sans-serif” }}>
<style>{`.t-phrase { color: #27AE60; display: block; } .k-phrase { color: #2980B9; display: block; margin-top: 4px; } .marker { position: absolute; left: 0; right: 0; border-top: 3px solid #FF7675; z-index: 50; } [contenteditable]:hover { background: rgba(0,0,0,0.05); border-radius: 4px; }`}</style>

```
  {view === "home" && (
    <div style={{ maxWidth:800, margin:"0 auto", padding:40 }}>
      <h1 style={{ textAlign:"center", fontWeight:900 }}>Kids&Us Master Planner 🎓</h1>
      <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:30, flexWrap:"wrap" }}>
        <button onClick={exportBackup} style={{ background:"#27AE60", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 }}>💾 Export Backup</button>
        <button onClick={() => importRef.current.click()} style={{ background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 }}>📂 Import Backup</button>
        <button onClick={handleLogout} style={{ background:"#DFE6E9", color:"#636e72", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 }}>🚪 Logout</button>
        <input type="file" ref={importRef} accept=".json" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) importBackup(e.target.files[0]); }} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20 }}>
        {CS.map(c => (
          <div key={c.id} onClick={() => { setSc(c); setV("course"); }} style={{ background:"#fff", padding:30, borderRadius:25, borderBottom:"8px solid " + c.color, cursor:"pointer", textAlign:"center", color:"#333" }}>
            <div style={{ fontSize:45 }}>{c.em}</div>
            <b>{c.name}</b>
          </div>
        ))}
      </div>
    </div>
  )}

  {view === "course" && (
    <div style={{ maxWidth:650, margin:"0 auto", padding:25 }}>
      <button onClick={() => setV("home")} style={{ background:"none", border:"none", fontWeight:900, color:sc.color }}>← BACK</button>
      <h1 style={{ color:sc.color }}>{sc.name}</h1>
      {["Story 1", "Story 2", "Story 3", "Story 4"].map(p => (
        <div key={p} style={{ background:"#fff", padding:20, borderRadius:25, marginBottom:15, color:"#333" }}>
          <b>{p}</b>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:10, marginTop:10 }}>
            {[...Array(10)].map((_, i) => (
              <button key={i} onClick={() => { setSp(p); setSd(i + 1); setV("lesson"); }} style={{ padding:15, borderRadius:12, border:"1px solid #EEE", background: lessons[sc.id + "|" + p + "|" + (i+1)] ? "#E8F5E9" : "#FFF", fontWeight:700 }}>{i + 1}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )}

  {view === "lesson" && (
    <div style={{ maxWidth:900, margin:"0 auto", padding: isLive ? 0 : 30 }}>
      <div className="no-print" style={{ display:"flex", justifyContent:"space-between", marginBottom:20, background: isLive ? "#111" : "#fff", padding:15, borderRadius:20, boxShadow:"0 5px 15px rgba(0,0,0,0.05)" }}>
        <button onClick={() => { setIsLive(false); setV("course"); }} style={{ color:sc.color, fontWeight:900, border:"none", background:"none" }}>← EXIT</button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={undo} style={{ background:"#f1f2f6", border:"none", borderRadius:10, padding:"0 15px", fontWeight:800 }}>UNDO ⏪</button>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ borderRadius:8, border:"none", padding:10, fontWeight:900, background:"#F1F2F6" }} />
          <button onClick={() => setIsLive(!isLive)} style={{ background:"#27AE60", color:"#fff", border:"none", padding:"10px 20px", borderRadius:12, fontWeight:800 }}>{isLive ? "EDIT" : "LIVE ▶️"}</button>
          <button onClick={() => window.print()} style={{ background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"0 20px" }}>🖨️ PRINT</button>
        </div>
      </div>

      <div style={{ background: isLive ? "#000" : "#fff", padding: isLive ? 20 : 45, borderRadius: isLive ? 0 : 35, position:"relative" }}>
        {isLive && <div className="marker" style={{ top: 150 + (((now - (new Date().setHours(...startTime.split(":")))) / 60000) * 15) }} />}
        <h1 style={{ color:sc.color, margin:0 }}>{sc.name} - Day {sd}</h1>
        <div style={{ fontWeight:900, color: totalMinutes > sc.limit ? "#D63031" : "#00B894", fontSize:18 }}>
          TOTAL: {totalMinutes} / {sc.limit} min
        </div>

        {!isLive && (
          <div style={{ background:"#F8F9FA", padding:20, borderRadius:20, margin:"25px 0", border:"1px solid #E9ECEF" }}>
            <b style={{ fontSize:11, color:"#A4B0BE", letterSpacing:1 }}>MATERIALS CHECKLIST:</b>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:10 }}>
              {Array.from(new Set(curL.map(a => a.materials).filter(m => m && !m.toLowerCase().includes("audio") && !m.toLowerCase().includes("track")).join(", ").split(", "))).map((m, i) => (
                <label key={i} style={{ fontSize:13, fontWeight:700, background:"#FFF", padding:"5px 10px", borderRadius:8, border:"1px solid #DDD" }}>
                  <input type="checkbox" /> {m.trim()}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:40 }}>
          {plan.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:30, paddingBottom:40, borderLeft:"8px solid " + sc.color, paddingLeft:30, position:"relative" }}>
              <div style={{ minWidth:90, fontWeight:900, color:sc.color, fontSize:22 }}>
                {a.start}<br /><span style={{ fontSize:12, opacity:0.3 }}>{a.end}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <b style={{ fontSize: isLive ? 28 : 22 }} contentEditable onBlur={e => updateAct(i, "name", e.target.innerText)}>{a.name}</b>
                  {!isLive && (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setClipboard(a); setSs("📋 Copied!"); }} style={{ border:"none", background:"#eee", borderRadius:5, fontSize:10, padding:5 }}>COPY</button>
                      <input type="text" placeholder="Audio" value={a.audio} onChange={e => updateAct(i, "audio", e.target.value)} style={{ width:80, border:"none", background:"#FFF9C4", borderRadius:5, textAlign:"center", fontWeight:900, fontSize:11 }} />
                      <input type="number" value={a.duration} onChange={e => updateAct(i, "duration", e.target.value)} style={{ width:40, border:"none", background:"#EEE", borderRadius:5, textAlign:"center", fontWeight:900 }} />
                      <button onClick={() => { const nl = [...curL]; nl.splice(i, 1); saveState({ ...lessons, [sc.id + "|" + sp + "|" + sd]: nl }); }} style={{ border:"none", background:"none", fontSize:20 }}>✕</button>
                    </div>
                  )}
                </div>
                {a.audio && <div style={{ background:"#FBC02D", color:"#000", display:"inline-block", padding:"2px 8px", borderRadius:5, fontSize:13, fontWeight:900, margin:"5px 0" }}>🎵 {a.audio}</div>}
                {a.target && (
                  <div className="target-box" style={{ background: isLive ? "#111" : "#F1F2F6", padding:12, borderRadius:10, margin:"10px 0", fontWeight:700 }} contentEditable onBlur={e => updateAct(i, "target", e.target.innerText)}>
                    {a.target.split("[K]").map((part, idx) => (
                      <span key={idx} className={idx === 0 ? "t-phrase" : "k-phrase"}>
                        {part.replace("[T]", "").replace("[K]", "").trim()}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: isLive ? 20 : 16, margin:"10px 0" }} contentEditable onBlur={e => updateAct(i, "desc", e.target.innerText)}>{a.desc}</p>
                <div style={{ fontSize:12, fontWeight:700, color:sc.color }} contentEditable onBlur={e => updateAct(i, "materials", e.target.innerText)}>🛠️ {a.materials}</div>
              </div>
            </div>
          ))}
        </div>

        {bonusActs.length > 0 && (
          <div style={{ marginTop:50, padding:35, background: isLive ? "#111" : "#FFF9DB", borderRadius:35, border:"3px dashed #FAB005" }}>
            <b style={{ color:"#F08C00", fontSize:18 }}>⭐ BONUS ACTIVITIES</b>
            {bonusActs.map((b, i) => (
              <div key={i} style={{ marginTop:20, borderBottom:"1px solid #FFE58F", paddingBottom:15 }}>
                <b style={{ fontSize:22 }} contentEditable onBlur={e => updateAct(plan.length + i, "name", e.target.innerText)}>{b.name}</b>
                {b.audio && <div style={{ color:"#FBC02D", fontWeight:900, margin:"5px 0" }}>🎵 {b.audio}</div>}
                <p style={{ fontSize:16 }} contentEditable onBlur={e => updateAct(plan.length + i, "desc", e.target.innerText)}>{b.desc}</p>
                <div style={{ fontSize:12, fontWeight:700 }} contentEditable onBlur={e => updateAct(plan.length + i, "materials", e.target.innerText)}>🛠️ {b.materials}</div>
              </div>
            ))}
          </div>
        )}

        {!isLive && (
          <div style={{ marginTop:40, display:"flex", gap:10 }}>
            <button onClick={() => fr.current.click()} style={{ flex:4, background:"#F1F2F6", border:"3px dashed #CCC", padding:30, borderRadius:25, fontWeight:900 }}>📸 SCAN LESSON</button>
            <button onClick={() => addActivity()} style={{ flex:1, background:sc.color, color:"#fff", border:"none", borderRadius:25, fontSize:35 }}>+</button>
            {clipboard && <button onClick={() => addActivity(clipboard)} style={{ flex:1.5, background:"#34495E", color:"#fff", border:"none", borderRadius:25, fontSize:10, fontWeight:900 }}>PASTE ACT.</button>}
            <input type="file" ref={fr} style={{ display:"none" }} onChange={e => uploadToAI(e.target.files)} />
          </div>
        )}
      </div>
    </div>
  )}

  {scn && <div style={{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#2F3542", color:"#fff", padding:"15px 30px", borderRadius:50, fontWeight:900, zIndex:10000 }}>{ss}</div>}
  {syncing && (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:20000 }}>
      <div style={{ background:"#fff", padding:30, borderRadius:20, fontWeight:900, fontSize:18 }}>⏳ Syncing...</div>
    </div>
  )}
</div>
```

);
}