import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

var supabase = createClient(
"https://zuaalqhbesywmfvuvgho.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWFscWhiZXN5d21mdnV2Z2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODM1OTksImV4cCI6MjA4OTM1OTU5OX0.9drUMBRWudHc_jh3n0pJaybr2qKZUCQvAezuGzb2pGI"
);

var CS = [
{id:"mousy",name:"Mousy",color:"#8CB43B",em:"\u{1F42D}",type:"baby",limit:45},
{id:"linda",name:"Linda",color:"#F26522",em:"\u{1F431}",type:"baby",limit:45},
{id:"sam",name:"Sam",color:"#00B3B0",em:"\u{1F9F8}",type:"kids",limit:60},
{id:"emma",name:"Emma",color:"#E878A0",em:"\u{1F98B}",type:"kids",limit:60},
{id:"oliver",name:"Oliver",color:"#00B3B0",em:"\u{1F438}",type:"kids",limit:60},
{id:"marcia",name:"Marcia",color:"#E94E58",em:"\u{1F380}",type:"kids",limit:60},
{id:"pam",name:"Pam & Paul",color:"#FFD700",em:"\u{1F46B}",type:"kids",limit:60},
{id:"ben",name:"Ben & Brenda",color:"#4B0082",em:"\u{1F9D1}",type:"teens",limit:90}
];

function LoginScreen() {
var s1 = useState(""); var email = s1[0]; var setEmail = s1[1];
var s2 = useState(""); var password = s2[0]; var setPassword = s2[1];
var s3 = useState(""); var error = s3[0]; var setError = s3[1];
var s4 = useState(false); var loading = s4[0]; var setLoading = s4[1];

var handleLogin = async function() {
setLoading(true);
setError("");
var result = await supabase.auth.signInWithPassword({ email: email, password: password });
if (result.error) {
setError("Errore: " + result.error.message);
setLoading(false);
}
};

return React.createElement("div", {
style: { minHeight:"100vh", background:"#F4F7F6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }
},
React.createElement("div", {
style: { background:"#fff", padding:50, borderRadius:30, boxShadow:"0 10px 40px rgba(0,0,0,0.1)", width:340, textAlign:"center" }
},
React.createElement("div", { style: { fontSize:60, marginBottom:10 } }, "\uD83C\uDF93"),
React.createElement("h2", { style: { fontWeight:900, marginBottom:30 } }, "Kids&Us Planner"),
React.createElement("input", {
type: "email",
placeholder: "Email",
value: email,
onChange: function(e) { setEmail(e.target.value); },
style: { width:"100%", padding:"12px 15px", borderRadius:12, border:"1px solid #DDD", fontSize:15, marginBottom:12, boxSizing:"border-box" }
}),
React.createElement("input", {
type: "password",
placeholder: "Password",
value: password,
onChange: function(e) { setPassword(e.target.value); },
onKeyDown: function(e) { if (e.key === "Enter") { handleLogin(); } },
style: { width:"100%", padding:"12px 15px", borderRadius:12, border:"1px solid #DDD", fontSize:15, marginBottom:20, boxSizing:"border-box" }
}),
error ? React.createElement("div", { style: { color:"#D63031", fontSize:13, marginBottom:12 } }, error) : null,
React.createElement("button", {
onClick: handleLogin,
disabled: loading,
style: { width:"100%", padding:"14px", background:"#8CB43B", color:"#fff", border:"none", borderRadius:12, fontWeight:900, fontSize:16, cursor:"pointer" }
}, loading ? "Loading" : "ACCEDI")
)
);
}

function MainApp(props) {
var session = props.session;
var s1 = useState("home"); var view = s1[0]; var setV = s1[1];
var s2 = useState(null); var sc = s2[0]; var setSc = s2[1];
var s3 = useState(""); var sp = s3[0]; var setSp = s3[1];
var s4 = useState(null); var sd = s4[0]; var setSd = s4[1];
var s5 = useState({}); var lessons = s5[0]; var setL = s5[1];
var s6 = useState([]); var history = s6[0]; var setHistory = s6[1];
var s7 = useState(null); var clipboard = s7[0]; var setClipboard = s7[1];
var s8 = useState(false); var scn = s8[0]; var setScn = s8[1];
var s9 = useState(""); var ss = s9[0]; var setSs = s9[1];
var s10 = useState(false); var isLive = s10[0]; var setIsLive = s10[1];
var s11 = useState("16:30"); var startTime = s11[0]; var setStartTime = s11[1];
var s12 = useState(new Date()); var now = s12[0]; var setNow = s12[1];
var s13 = useState(false); var syncing = s13[0]; var setSyncing = s13[1];
var s14 = useState(false); var loadingData = s14[0]; var setLoadingData = s14[1];
var fr = useRef(null);
var importRef = useRef(null);

useEffect(function() {
var t = setInterval(function() { setNow(new Date()); }, 1000);
return function() { clearInterval(t); };
}, []);

useEffect(function() {
setLoadingData(true);
supabase.from("lessons").select("key, data").then(function(res) {
if (!res.error && res.data) {
var merged = {};
res.data.forEach(function(row) { merged[row.key] = row.data; });
setL(merged);
}
setLoadingData(false);
});
}, [session]);

var saveLesson = function(key, data) {
supabase.from("lessons").upsert(
{ user_id: session.user.id, key: key, data: data },
{ onConflict: "user_id,key" }
);
};

var saveState = function(newL) {
setHistory(function(h) { return h.concat([lessons]); });
setL(newL);
var keys = Object.keys(newL);
for (var i = 0; i < keys.length; i++) {
var key = keys[i];
if (JSON.stringify(newL[key]) !== JSON.stringify(lessons[key])) {
saveLesson(key, newL[key]);
}
}
};

var undo = function() {
if (history.length > 0) {
setL(history[history.length - 1]);
setHistory(function(h) { return h.slice(0, -1); });
setSs("Undo!");
setScn(true);
setTimeout(function() { setScn(false); }, 2000);
}
};

var exportBackup = function() {
var blob = new Blob([JSON.stringify(lessons, null, 2)], { type: "application/json" });
var url = URL.createObjectURL(blob);
var a = document.createElement("a");
a.href = url;
a.download = "kids-us-backup-" + new Date().toISOString().slice(0,10) + ".json";
a.click();
URL.revokeObjectURL(url);
setSs("Backup exported!");
setScn(true);
setTimeout(function() { setScn(false); }, 3000);
};

var importBackup = function(file) {
var reader = new FileReader();
reader.onload = function(e) {
try {
var parsed = JSON.parse(e.target.result);
setSyncing(true);
var keys = Object.keys(parsed);
var done = 0;
if (keys.length === 0) { setSyncing(false); return; }
keys.forEach(function(key) {
supabase.from("lessons").upsert(
{ user_id: session.user.id, key: key, data: parsed[key] },
{ onConflict: "user_id,key" }
).then(function() {
done++;
if (done === keys.length) {
setL(parsed);
setSyncing(false);
setSs("Backup restored!");
setScn(true);
setTimeout(function() { setScn(false); }, 3000);
}
});
});
} catch(err) {
setSyncing(false);
setSs("File non valido.");
setScn(true);
setTimeout(function() { setScn(false); }, 3000);
}
};
reader.readAsText(file);
};

var handleLogout = function() {
supabase.auth.signOut();
};

var uploadToAI = async function(files) {
setScn(true);
setSs("Scanning…");
try {
var b64 = await new Promise(function(resolve) {
var rd = new FileReader();
rd.onload = function() { resolve(rd.result.split(",")[1]); };
rd.readAsDataURL(files[0]);
});
var promptMsg = "Extract Kids&Us lesson. Use ONLY English. Find Track or Audio and put in audio field. Target Language: Verbatim. Use [T] for Teacher, [K] for Kids. If Bonus set is_bonus true. Return JSON array: [{name,duration,audio,desc,target,materials,is_bonus}]";
var res = await fetch("/api/generate", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ imageB64: b64, mimeType: files[0].type || "image/jpeg", prompt: promptMsg })
});
var d = await res.json();
var cleanText = d.text.replace(/`json|`/g, "").trim();
var parsed = JSON.parse(cleanText.match(/{[\s\S]*}|[[\s\S]*]/)[0]);
var key = sc.id + "|" + sp + "|" + sd;
var newL = Object.assign({}, lessons);
newL[key] = parsed;
saveState(newL);
setSs("Synced!");
} catch(e) {
setSs("Error: " + e.message);
}
setTimeout(function() { setScn(false); }, 3000);
};

var addActivity = function(item) {
var key = sc.id + "|" + sp + "|" + sd;
var newAct = item ? Object.assign({}, item) : { name:"New", duration:5, audio:"", desc:"", target:"[T] … [K] …", materials:"", is_bonus:false };
var newArr = (lessons[key] || []).concat([newAct]);
var newL = Object.assign({}, lessons);
newL[key] = newArr;
saveState(newL);
};

var updateAct = function(idx, field, val) {
var key = sc.id + "|" + sp + "|" + sd;
var newArr = (lessons[key] || []).slice();
newArr[idx] = Object.assign({}, newArr[idx]);
newArr[idx][field] = val;
var newL = Object.assign({}, lessons);
newL[key] = newArr;
saveState(newL);
};

var lkey = sc ? sc.id + "|" + sp + "|" + sd : "";
var curL = lessons[lkey] || [];
var normalActs = curL.filter(function(a) { return !a.is_bonus || (sc && sc.type === "baby"); });
var bonusActs = curL.filter(function(a) { return a.is_bonus && sc && sc.type !== "baby"; });

var totalMinutes = 0;
var lastTime = startTime;
var plan = normalActs.map(function(a, i) {
var dur = parseInt(a.duration) || 0;
var parts = lastTime.split(":");
var h = Number(parts[0]);
var m = Number(parts[1]);
var start = lastTime;
var date = new Date();
date.setHours(h, m + dur);
lastTime = date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
totalMinutes += dur;
return Object.assign({}, a, { start:start, end:lastTime, id:i });
});

var scColor = sc ? sc.color : "#8CB43B";
var scLimit = sc ? sc.limit : 60;
var scName = sc ? sc.name : "";

if (loadingData) {
return React.createElement("div", {
style: { minHeight:"100vh", background:"#F4F7F6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }
},
React.createElement("div", { style: { textAlign:"center" } },
React.createElement("div", { style: { fontSize:50 } }, "\u23F3"),
React.createElement("p", { style: { fontWeight:900, marginTop:20 } }, "Caricamento lezioni…")
)
);
}

return React.createElement("div", {
style: { minHeight:"100vh", background: isLive ? "#000" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436", fontFamily:"sans-serif" }
},
React.createElement("style", null,
".t-phrase{color:#27AE60;display:block;}.k-phrase{color:#2980B9;display:block;margin-top:4px;}[contenteditable]:hover{background:rgba(0,0,0,0.05);border-radius:4px;}"
),

```
view === "home" && React.createElement("div", { style: { maxWidth:800, margin:"0 auto", padding:40 } },
  React.createElement("h1", { style: { textAlign:"center", fontWeight:900 } }, "Kids&Us Master Planner \uD83C\uDF93"),
  React.createElement("div", { style: { display:"flex", gap:10, justifyContent:"center", marginBottom:30, flexWrap:"wrap" } },
    React.createElement("button", { onClick: exportBackup, style: { background:"#27AE60", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Export Backup"),
    React.createElement("button", { onClick: function() { importRef.current.click(); }, style: { background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Import Backup"),
    React.createElement("button", { onClick: handleLogout, style: { background:"#DFE6E9", color:"#636e72", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Logout"),
    React.createElement("input", { type:"file", ref:importRef, accept:".json", style:{ display:"none" }, onChange: function(e) { if (e.target.files[0]) { importBackup(e.target.files[0]); } } })
  ),
  React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20 } },
    CS.map(function(c) {
      return React.createElement("div", {
        key: c.id,
        onClick: function() { setSc(c); setV("course"); },
        style: { background:"#fff", padding:30, borderRadius:25, borderBottom:"8px solid " + c.color, cursor:"pointer", textAlign:"center", color:"#333" }
      },
        React.createElement("div", { style: { fontSize:45 } }, c.em),
        React.createElement("b", null, c.name)
      );
    })
  )
),

view === "course" && React.createElement("div", { style: { maxWidth:650, margin:"0 auto", padding:25 } },
  React.createElement("button", { onClick: function() { setV("home"); }, style: { background:"none", border:"none", fontWeight:900, color:scColor } }, "\u2190 BACK"),
  React.createElement("h1", { style: { color:scColor } }, scName),
  ["Story 1","Story 2","Story 3","Story 4"].map(function(p) {
    return React.createElement("div", { key:p, style: { background:"#fff", padding:20, borderRadius:25, marginBottom:15, color:"#333" } },
      React.createElement("b", null, p),
      React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:10, marginTop:10 } },
        Array.from({ length:10 }, function(_, i) {
          var dayKey = sc ? sc.id + "|" + p + "|" + (i+1) : "";
          return React.createElement("button", {
            key: i,
            onClick: function() { setSp(p); setSd(i+1); setV("lesson"); },
            style: { padding:15, borderRadius:12, border:"1px solid #EEE", background: lessons[dayKey] ? "#E8F5E9" : "#FFF", fontWeight:700 }
          }, i+1);
        })
      )
    );
  })
),

view === "lesson" && React.createElement("div", { style: { maxWidth:900, margin:"0 auto", padding: isLive ? 0 : 30 } },
  React.createElement("div", { className:"no-print", style: { display:"flex", justifyContent:"space-between", marginBottom:20, background: isLive ? "#111" : "#fff", padding:15, borderRadius:20, boxShadow:"0 5px 15px rgba(0,0,0,0.05)" } },
    React.createElement("button", { onClick: function() { setIsLive(false); setV("course"); }, style: { color:scColor, fontWeight:900, border:"none", background:"none" } }, "\u2190 EXIT"),
    React.createElement("div", { style: { display:"flex", gap:10 } },
      React.createElement("button", { onClick: undo, style: { background:"#f1f2f6", border:"none", borderRadius:10, padding:"0 15px", fontWeight:800 } }, "UNDO"),
      React.createElement("input", { type:"time", value:startTime, onChange: function(e) { setStartTime(e.target.value); }, style: { borderRadius:8, border:"none", padding:10, fontWeight:900, background:"#F1F2F6" } }),
      React.createElement("button", { onClick: function() { setIsLive(!isLive); }, style: { background:"#27AE60", color:"#fff", border:"none", padding:"10px 20px", borderRadius:12, fontWeight:800 } }, isLive ? "EDIT" : "LIVE"),
      React.createElement("button", { onClick: function() { window.print(); }, style: { background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"0 20px" } }, "PRINT")
    )
  ),

  React.createElement("div", { style: { background: isLive ? "#000" : "#fff", padding: isLive ? 20 : 45, borderRadius: isLive ? 0 : 35, position:"relative" } },
    React.createElement("h1", { style: { color:scColor, margin:0 } }, scName + " - Day " + sd),
    React.createElement("div", { style: { fontWeight:900, color: totalMinutes > scLimit ? "#D63031" : "#00B894", fontSize:18 } }, "TOTAL: " + totalMinutes + " / " + scLimit + " min"),

    !isLive && React.createElement("div", { style: { background:"#F8F9FA", padding:20, borderRadius:20, margin:"25px 0", border:"1px solid #E9ECEF" } },
      React.createElement("b", { style: { fontSize:11, color:"#A4B0BE", letterSpacing:1 } }, "MATERIALS CHECKLIST:"),
      React.createElement("div", { style: { display:"flex", flexWrap:"wrap", gap:10, marginTop:10 } },
        Array.from(new Set(
          curL.map(function(a) { return a.materials || ""; })
            .filter(function(m) { return m && !m.toLowerCase().includes("audio") && !m.toLowerCase().includes("track"); })
            .join(", ").split(", ")
            .filter(function(m) { return m.trim() !== ""; })
        )).map(function(m, i) {
          return React.createElement("label", { key:i, style: { fontSize:13, fontWeight:700, background:"#FFF", padding:"5px 10px", borderRadius:8, border:"1px solid #DDD" } },
            React.createElement("input", { type:"checkbox" }), " " + m.trim()
          );
        })
      )
    ),

    React.createElement("div", { style: { marginTop:40 } },
      plan.map(function(a, i) {
        return React.createElement("div", { key:i, style: { display:"flex", gap:30, paddingBottom:40, borderLeft:"8px solid " + scColor, paddingLeft:30, position:"relative" } },
          React.createElement("div", { style: { minWidth:90, fontWeight:900, color:scColor, fontSize:22 } },
            a.start, React.createElement("br", null),
            React.createElement("span", { style: { fontSize:12, opacity:0.3 } }, a.end)
          ),
          React.createElement("div", { style: { flex:1 } },
            React.createElement("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"flex-start" } },
              React.createElement("b", { style: { fontSize: isLive ? 28 : 22 }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(i, "name", e.target.innerText); } }, a.name),
              !isLive && React.createElement("div", { style: { display:"flex", gap:8 } },
                React.createElement("button", { onClick: function() { setClipboard(a); setSs("Copied!"); setScn(true); setTimeout(function(){ setScn(false); }, 2000); }, style: { border:"none", background:"#eee", borderRadius:5, fontSize:10, padding:5 } }, "COPY"),
                React.createElement("input", { type:"text", placeholder:"Audio", value:a.audio, onChange: function(e) { updateAct(i, "audio", e.target.value); }, style: { width:80, border:"none", background:"#FFF9C4", borderRadius:5, textAlign:"center", fontWeight:900, fontSize:11 } }),
                React.createElement("input", { type:"number", value:a.duration, onChange: function(e) { updateAct(i, "duration", e.target.value); }, style: { width:40, border:"none", background:"#EEE", borderRadius:5, textAlign:"center", fontWeight:900 } }),
                React.createElement("button", { onClick: function() { var nl = curL.slice(); nl.splice(i,1); var nL = Object.assign({}, lessons); nL[lkey] = nl; saveState(nL); }, style: { border:"none", background:"none", fontSize:20 } }, "X")
              )
            ),
            a.audio && React.createElement("div", { style: { background:"#FBC02D", color:"#000", display:"inline-block", padding:"2px 8px", borderRadius:5, fontSize:13, fontWeight:900, margin:"5px 0" } }, "\uD83C\uDFB5 " + a.audio),
            a.target && React.createElement("div", { style: { background: isLive ? "#111" : "#F1F2F6", padding:12, borderRadius:10, margin:"10px 0", fontWeight:700 }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(i, "target", e.target.innerText); } },
              a.target.split("[K]").map(function(part, idx) {
                return React.createElement("span", { key:idx, className: idx === 0 ? "t-phrase" : "k-phrase" },
                  part.replace("[T]","").replace("[K]","").trim()
                );
              })
            ),
            React.createElement("p", { style: { fontSize: isLive ? 20 : 16, margin:"10px 0" }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(i, "desc", e.target.innerText); } }, a.desc),
            React.createElement("div", { style: { fontSize:12, fontWeight:700, color:scColor }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(i, "materials", e.target.innerText); } }, a.materials)
          )
        );
      })
    ),

    bonusActs.length > 0 && React.createElement("div", { style: { marginTop:50, padding:35, background: isLive ? "#111" : "#FFF9DB", borderRadius:35, border:"3px dashed #FAB005" } },
      React.createElement("b", { style: { color:"#F08C00", fontSize:18 } }, "BONUS ACTIVITIES"),
      bonusActs.map(function(b, i) {
        return React.createElement("div", { key:i, style: { marginTop:20, borderBottom:"1px solid #FFE58F", paddingBottom:15 } },
          React.createElement("b", { style: { fontSize:22 }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(plan.length + i, "name", e.target.innerText); } }, b.name),
          b.audio && React.createElement("div", { style: { color:"#FBC02D", fontWeight:900, margin:"5px 0" } }, "\uD83C\uDFB5 " + b.audio),
          React.createElement("p", { style: { fontSize:16 }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(plan.length + i, "desc", e.target.innerText); } }, b.desc),
          React.createElement("div", { style: { fontSize:12, fontWeight:700 }, contentEditable:true, suppressContentEditableWarning:true, onBlur: function(e) { updateAct(plan.length + i, "materials", e.target.innerText); } }, b.materials)
        );
      })
    ),

    !isLive && React.createElement("div", { style: { marginTop:40, display:"flex", gap:10 } },
      React.createElement("button", { onClick: function() { fr.current.click(); }, style: { flex:4, background:"#F1F2F6", border:"3px dashed #CCC", padding:30, borderRadius:25, fontWeight:900 } }, "SCAN LESSON"),
      React.createElement("button", { onClick: function() { addActivity(null); }, style: { flex:1, background:scColor, color:"#fff", border:"none", borderRadius:25, fontSize:35 } }, "+"),
      clipboard ? React.createElement("button", { onClick: function() { addActivity(clipboard); }, style: { flex:1.5, background:"#34495E", color:"#fff", border:"none", borderRadius:25, fontSize:10, fontWeight:900 } }, "PASTE") : null,
      React.createElement("input", { type:"file", ref:fr, style:{ display:"none" }, onChange: function(e) { uploadToAI(e.target.files); } })
    )
  )
),

scn && React.createElement("div", { style: { position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#2F3542", color:"#fff", padding:"15px 30px", borderRadius:50, fontWeight:900, zIndex:10000 } }, ss),
syncing && React.createElement("div", { style: { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:20000 } },
  React.createElement("div", { style: { background:"#fff", padding:30, borderRadius:20, fontWeight:900, fontSize:18 } }, "Syncing...")
)
```

);
}

export default function App() {
var s1 = useState(null); var session = s1[0]; var setSession = s1[1];
var s2 = useState(false); var checked = s2[0]; var setChecked = s2[1];

useEffect(function() {
supabase.auth.getSession().then(function(res) {
setSession(res.data.session);
setChecked(true);
});
var listener = supabase.auth.onAuthStateChange(function(event, sess) {
setSession(sess);
});
return function() { listener.data.subscription.unsubscribe(); };
}, []);

if (!checked) {
return React.createElement("div", {
style: { minHeight:"100vh", background:"#F4F7F6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }
}, React.createElement("div", { style: { fontSize:40 } }, "\u23F3"));
}

if (!session) {
return React.createElement(LoginScreen, null);
}

return React.createElement(MainApp, { session: session });
}