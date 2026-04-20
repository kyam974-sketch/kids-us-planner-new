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

var safeStr = function(val) { return val ? String(val) : ""; };

var timeToMins = function(t) {
  var parts = t.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  render() {
    if (this.state.hasError) {
      return React.createElement("div", {
        style: { minHeight:"100vh", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", padding:40 }
      },
        React.createElement("div", { style: { maxWidth:600, textAlign:"center" } },
          React.createElement("div", { style: { fontSize:50, marginBottom:20 } }, "\u26A0\uFE0F"),
          React.createElement("h2", { style: { color:"#D63031" } }, "Errore rilevato"),
          React.createElement("p", { style: { background:"#F8F9FA", padding:20, borderRadius:12, fontFamily:"monospace", fontSize:13, wordBreak:"break-all", textAlign:"left" } },
            this.state.error ? this.state.error.message : "Errore sconosciuto"
          ),
          React.createElement("button", {
            onClick: function() { window.location.reload(); },
            style: { marginTop:20, padding:"10px 30px", background:"#8CB43B", color:"#fff", border:"none", borderRadius:12, fontWeight:900, cursor:"pointer" }
          }, "Ricarica")
        )
      );
    }
    return this.props.children;
  }
}

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
        type:"email", placeholder:"Email", value:email,
        onChange: function(e) { setEmail(e.target.value); },
        style: { width:"100%", padding:"12px 15px", borderRadius:12, border:"1px solid #DDD", fontSize:15, marginBottom:12, boxSizing:"border-box" }
      }),
      React.createElement("input", {
        type:"password", placeholder:"Password", value:password,
        onChange: function(e) { setPassword(e.target.value); },
        onKeyDown: function(e) { if (e.key === "Enter") { handleLogin(); } },
        style: { width:"100%", padding:"12px 15px", borderRadius:12, border:"1px solid #DDD", fontSize:15, marginBottom:20, boxSizing:"border-box" }
      }),
      error ? React.createElement("div", { style: { color:"#D63031", fontSize:13, marginBottom:12 } }, error) : null,
      React.createElement("button", {
        onClick: handleLogin, disabled: loading,
        style: { width:"100%", padding:"14px", background:"#8CB43B", color:"#fff", border:"none", borderRadius:12, fontWeight:900, fontSize:16, cursor:"pointer" }
      }, loading ? "Loading" : "ACCEDI")
    )
  );
}

function LessonView(props) {
  var sc = props.sc;
  var sp = props.sp;
  var sd = props.sd;
  var lessons = props.lessons;
  var onBack = props.onBack;
  var onSave = props.onSave;

  var s1 = useState([]); var history = s1[0]; var setHistory = s1[1];
  var s2 = useState(props.initialClipboard || null); var clipboard = s2[0]; var setClipboard = s2[1];
  var s3 = useState(false); var isLive = s3[0]; var setIsLive = s3[1];
  var s4 = useState("16:30"); var startTime = s4[0]; var setStartTime = s4[1];
  var s5 = useState(new Date()); var now = s5[0]; var setNow = s5[1];
  var s6 = useState(false); var scn = s6[0]; var setScn = s6[1];
  var s7 = useState(""); var ss = s7[0]; var setSs = s7[1];
  var fr = useRef(null);

  useEffect(function() {
    var t = setInterval(function() { setNow(new Date()); }, 1000);
    return function() { clearInterval(t); };
  }, []);

  var lkey = sc.id + "|" + sp + "|" + sd;
  var curL = lessons[lkey] || [];
  var normalActs = curL.filter(function(a) { return !a.is_bonus || sc.type === "baby"; });
  var bonusActs = curL.filter(function(a) { return a.is_bonus && sc.type !== "baby"; });

  var showMsg = function(msg) {
    setSs(msg); setScn(true);
    setTimeout(function() { setScn(false); }, 2000);
  };

  var saveActs = function(newActs) {
    setHistory(function(h) { return h.concat([curL]); });
    var newL = Object.assign({}, lessons);
    newL[lkey] = newActs;
    onSave(newL, lkey, newActs);
  };

  var undo = function() {
    if (history.length > 0) {
      var prev = history[history.length - 1];
      setHistory(function(h) { return h.slice(0, -1); });
      var newL = Object.assign({}, lessons);
      newL[lkey] = prev;
      onSave(newL, lkey, prev);
      showMsg("Undo!");
    }
  };

  var updateAct = function(idx, field, val) {
    var newArr = curL.slice();
    newArr[idx] = Object.assign({}, newArr[idx]);
    newArr[idx][field] = val;
    saveActs(newArr);
  };

  var addActivity = function(item) {
    var newAct = item ? Object.assign({}, item) : { name:"New", duration:5, audio:"", desc:"", target:"[T] ... [K] ...", materials:"", is_bonus:false };
    saveActs(curL.concat([newAct]));
  };

  var deleteAct = function(idx) {
    var newArr = curL.slice();
    newArr.splice(idx, 1);
    saveActs(newArr);
  };

  var clearLesson = function() {
    saveActs([]);
  };

  var exportExcel = function() {
    var rows = [["Inizio", "Fine", "Durata (min)", "Attivita", "Descrizione", "Materiali", "Audio"]];
    plan.forEach(function(a) {
      rows.push([
        a.start || "",
        a.end || "",
        parseInt(a.duration) || 0,
        safeStr(a.name),
        safeStr(a.desc),
        safeStr(a.materials),
        safeStr(a.audio)
      ]);
    });
    bonusActs.forEach(function(a) {
      rows.push([
        "BONUS", "", "",
        safeStr(a.name),
        safeStr(a.desc),
        safeStr(a.materials),
        safeStr(a.audio)
      ]);
    });

    var maxWidths = rows[0].map(function(_, ci) {
      return Math.max.apply(null, rows.map(function(r) { return String(r[ci] || "").length; }));
    });

    var csv = rows.map(function(row) {
      return row.map(function(cell) {
        var s = String(cell || "").replace(/"/g, '""');
        return '"' + s + '"';
      }).join(",");
    }).join("\n");

    var bom = "\uFEFF";
    var blob = new Blob([bom + csv], { type:"text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = scName + " - Day " + sd + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    showMsg("File scaricato!");
  };

  var uploadToAI = async function(files) {
    setSs("Analisi in corso..."); setScn(true);
    try {
      setSs("Caricamento immagine...");
      var b64 = await new Promise(function(resolve) {
        var rd = new FileReader();
        rd.onload = function() { resolve(rd.result.split(",")[1]); };
        rd.readAsDataURL(files[0]);
      });
      setSs("Analisi AI in corso...");
      var contextKey = sc.id + "|context|" + sp;
      var contextData = lessons[contextKey];
      var contextInfo = contextData && typeof contextData === "string" ? "\n\nSTORY CONTEXT (routines, objectives, choosing rhyme):\n" + contextData : "";
      var promptMsg = "Extract Kids&Us lesson from this teacher guide page. Use ONLY English. Find Track or Audio and put in audio field. If Bonus set is_bonus true." + contextInfo + "\n\nIMPORTANT: Include warm-up and goodbye routines from context as first and last activities. Choosing rhyme is NOT a separate activity, mention it only in descriptions where used.\n\nFor the desc field: write a single flowing narrative description of the activity. Embed the key phrases to say (target language) directly inside the description using **double asterisks** around them, like this example: 'Greet each child warmly and say **Hello Jane! Nice to see you!** They respond **Fine, thank you.** Then ask **How are you today?**'\n\nDo NOT use a separate target field. Return JSON array: [{name,duration,audio,desc,materials,is_bonus}]";
      var res = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ imageB64:b64, mimeType:files[0].type || "image/jpeg", prompt:promptMsg })
      });
      setSs("Elaborazione risultati...");
      var d = await res.json();
      var cleanText = d.text.replace(/```json|```/g, "").trim();
      var parsed = JSON.parse(cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)[0]);
      saveActs(parsed);
      setSs("Lezione sincronizzata!");
      setTimeout(function() { setScn(false); }, 3000);
    } catch(e) {
      setSs("Errore: " + e.message);
      setTimeout(function() { setScn(false); }, 5000);
    }
  };

  var totalMinutes = 0;
  var lastTime = startTime;
  var plan = normalActs.map(function(a, i) {
    var dur = parseInt(a.duration) || 0;
    var parts = lastTime.split(":");
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    var start = lastTime;
    var date = new Date();
    date.setHours(h, m + dur, 0, 0);
    lastTime = date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    totalMinutes += dur;
    return Object.assign({}, a, { start:start, end:lastTime, idx:i });
  });

  var scColor = sc.color;
  var scLimit = sc.limit;
  var scName = sc.name;
  var nowMins = now.getHours() * 60 + now.getMinutes();

  var currentActIdx = -1;
  for (var pi = 0; pi < plan.length; pi++) {
    var actStartMins = timeToMins(plan[pi].start);
    var actEndMins = timeToMins(plan[pi].end);
    if (nowMins >= actStartMins && nowMins < actEndMins) {
      currentActIdx = pi;
      break;
    }
  }

  return React.createElement(ErrorBoundary, null,
    React.createElement("div", {
      style: { minHeight:"100vh", background: isLive ? "#E3F2FD" : "#F4F7F6", color: isLive ? "#FFF" : "#2D3436", fontFamily:"sans-serif" }
    },
      React.createElement("style", null, ".t-phrase{color:#27AE60;display:block;}.k-phrase{color:#2980B9;display:block;margin-top:4px;}[contenteditable]:hover{background:rgba(0,0,0,0.05);border-radius:4px;}"),

      React.createElement("div", { className:"no-print", style:{ display:"flex", justifyContent:"space-between", background: isLive ? "#E3F2FD" : "#fff", padding:15, boxShadow:"0 5px 15px rgba(0,0,0,0.05)" } },
        React.createElement("button", { onClick:onBack, style:{ color:scColor, fontWeight:900, border:"none", background:"none", fontSize:16 } }, "\u2190 EXIT"),
        React.createElement("div", { style:{ display:"flex", gap:10 } },
          React.createElement("button", { onClick:undo, style:{ background:"#f1f2f6", border:"none", borderRadius:10, padding:"0 15px", fontWeight:800 } }, "UNDO"),
          React.createElement("input", { type:"time", value:startTime, onChange:function(e){ setStartTime(e.target.value); }, style:{ borderRadius:8, border:"none", padding:10, fontWeight:900, background:"#F1F2F6" } }),
          React.createElement("button", { onClick:function(){ setIsLive(!isLive); }, style:{ background:"#27AE60", color:"#fff", border:"none", padding:"10px 20px", borderRadius:12, fontWeight:800 } }, isLive ? "EDIT" : "LIVE"),

          React.createElement("button", { onClick:function(){ window.print(); }, style:{ background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"0 20px" } }, "PRINT"),
          React.createElement("button", { onClick:exportExcel, style:{ background:"#00B894", color:"#fff", border:"none", borderRadius:12, padding:"0 15px", fontWeight:800 } }, "\uD83D\uDCCA CSV"),
          React.createElement("button", { onClick:function(){ if(window.confirm("Cancellare tutta la lezione?")){ clearLesson(); } }, style:{ background:"#D63031", color:"#fff", border:"none", borderRadius:12, padding:"0 15px", fontWeight:800 } }, "\uD83D\uDDD1")
        )
      ),

      isLive && React.createElement("div", { style:{ background:"#FF7675", padding:"10px 20px", textAlign:"center", fontSize:16, fontWeight:900, color:"#fff" } },
        now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) +
        (currentActIdx >= 0 ? "  \u25B6  " + safeStr(plan[currentActIdx].name) : "  \u23F3  In attesa...")
      ),

      React.createElement("div", { style:{ maxWidth:900, margin:"0 auto", padding: isLive ? 20 : 30 } },
        React.createElement("div", { style:{ background: isLive ? "#E3F2FD" : "#fff", padding: isLive ? 20 : 45, borderRadius: isLive ? 0 : 35 } },
          React.createElement("h1", { style:{ color:scColor, margin:0 } }, scName + " - Day " + sd),
          React.createElement("div", { style:{ fontWeight:900, color: totalMinutes > scLimit ? "#D63031" : "#00B894", fontSize:18 } }, "TOTAL: " + totalMinutes + " / " + scLimit + " min"),

          !isLive && React.createElement("div", { style:{ background:"#F8F9FA", padding:20, borderRadius:20, margin:"25px 0", border:"1px solid #E9ECEF" } },
            React.createElement("b", { style:{ fontSize:11, color:"#A4B0BE", letterSpacing:1 } }, "MATERIALS CHECKLIST:"),
            React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10, alignItems:"center" } },
              (function(){
                var allMats = Array.from(new Set(
                  curL.map(function(a){ return safeStr(a.materials); })
                    .filter(function(m){ return m && !m.toLowerCase().includes("audio") && !m.toLowerCase().includes("track"); })
                    .join(", ").split(",")
                    .map(function(m){ return m.trim(); })
                    .filter(function(m){ return m !== ""; })
                ));
                var removeMat = function(matToRemove) {
                  var newArr = curL.map(function(act) {
                    var mats = safeStr(act.materials).split(",").map(function(m){ return m.trim(); }).filter(function(m){ return m && m !== matToRemove; });
                    return Object.assign({}, act, { materials: mats.join(", ") });
                  });
                  saveActs(newArr);
                };
                var renameMat = function(oldMat, newMat) {
                  if (!newMat.trim() || newMat === oldMat) { return; }
                  var newArr = curL.map(function(act) {
                    var mats = safeStr(act.materials).split(",").map(function(m){
                      var t = m.trim();
                      return t === oldMat ? newMat.trim() : t;
                    }).filter(function(m){ return m; });
                    return Object.assign({}, act, { materials: mats.join(", ") });
                  });
                  saveActs(newArr);
                };
                return allMats.map(function(m, ci){
                  return React.createElement("div", { key:ci, style:{ display:"flex", alignItems:"center", gap:4, background:"#FFF", padding:"4px 10px", borderRadius:8, border:"1px solid #DDD" } },
                    React.createElement("input", { type:"checkbox" }),
                    React.createElement("span", {
                      contentEditable:true, suppressContentEditableWarning:true,
                      style:{ fontSize:13, fontWeight:700, outline:"none", minWidth:20 },
                      onBlur:function(e){ renameMat(m, e.target.innerText); }
                    }, m),
                    React.createElement("span", {
                      onClick:function(){ removeMat(m); },
                      style:{ cursor:"pointer", color:"#D63031", fontWeight:900, fontSize:14, marginLeft:2, lineHeight:1 }
                    }, "×")
                  );
                });
              })(),
              React.createElement("button", {
                onClick:function(){
                  var newMat = window.prompt("Nuovo materiale:");
                  if (newMat && newMat.trim()) {
                    var newArr = curL.map(function(act, ai) {
                      if (ai === 0) {
                        var mats = safeStr(act.materials);
                        return Object.assign({}, act, { materials: mats ? mats + ", " + newMat.trim() : newMat.trim() });
                      }
                      return act;
                    });
                    saveActs(newArr);
                  }
                },
                style:{ fontSize:13, fontWeight:900, background:scColor, color:"#fff", border:"none", borderRadius:8, padding:"5px 12px", cursor:"pointer" }
              }, "+ Aggiungi")
            )
          ),

          React.createElement("div", { style:{ marginTop:40 } },
            plan.map(function(a, i){
              var target = safeStr(a.target);
              var desc = safeStr(a.desc);
              var audio = safeStr(a.audio);
              var materials = safeStr(a.materials);
              var name = safeStr(a.name) || "Activity";
              var duration = a.duration || 0;
              var isCurrent = isLive && i === currentActIdx;

              var pctFill = 0;
              if (isCurrent && isLive) {
                var _start = timeToMins(a.start);
                var _end = timeToMins(a.end);
                var _total = _end - _start;
                var _elapsed = Math.max(0, Math.min(_total, nowMins - _start));
                pctFill = _total > 0 ? Math.round((_elapsed / _total) * 100) : 0;
              }
              return React.createElement("div", {
                key:i,
                style:{
                  display:"flex", gap:30, paddingBottom:40, paddingTop: isCurrent ? 20 : 0,
                  borderLeft: isCurrent ? "12px solid #FF7675" : "8px solid " + scColor,
                  paddingLeft:30,
                  background: isCurrent
                    ? "linear-gradient(to right, rgba(255,118,117,0.18) " + pctFill + "%, #BBDEFB " + pctFill + "%)"
                    : "transparent",
                  borderRadius: isCurrent ? 16 : 0,
                  marginBottom: isCurrent ? 10 : 0,
                  boxShadow: isCurrent ? "0 0 20px rgba(25,118,210,0.3)" : "none",
                  transition:"background 30s linear"
                }
              },
                React.createElement("div", { style:{ minWidth:90, fontWeight:900, color: isCurrent ? "#FF7675" : scColor, fontSize:22 } },
                  a.start, React.createElement("br", null),
                  React.createElement("span", { style:{ fontSize:12, opacity:0.3 } }, a.end),
                ),
                React.createElement("div", { style:{ flex:1 } },
                  React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" } },
                    React.createElement("b", { style:{ fontSize: isLive ? 28 : 22, color: isCurrent ? "#FF7675" : (isLive ? "#1a237e" : "inherit") } }, isCurrent ? "\u25B6 " + name : name),
                    !isLive && React.createElement("div", { style:{ display:"flex", gap:8 } },
                      React.createElement("button", { onClick:function(){ setClipboard(a); showMsg("Copied!"); }, style:{ border:"none", background:"#eee", borderRadius:5, fontSize:10, padding:5 } }, "COPY"),
                      React.createElement("input", { type:"text", placeholder:"Audio", value:audio, onChange:function(e){ updateAct(i, "audio", e.target.value); }, style:{ width:80, border:"none", background:"#FFF9C4", borderRadius:5, textAlign:"center", fontWeight:900, fontSize:11 } }),
                      React.createElement("div", { style:{ display:"flex", alignItems:"center", background:"#EEE", borderRadius:5, padding:"0 5px", minWidth:65 } },
                        React.createElement("input", { type:"number", defaultValue:parseInt(duration)||0, key:"dur-"+i+"-"+parseInt(duration), onChange:function(e){ updateAct(i, "duration", parseInt(e.target.value)||0); }, style:{ width:38, border:"none", background:"transparent", textAlign:"center", fontWeight:900, fontSize:15, color:"#2D3436" } }),
                        React.createElement("span", { style:{ fontSize:12, fontWeight:700, color:"#636e72" } }, "min")
                      ),
                      React.createElement("button", { onClick:function(){ deleteAct(i); }, style:{ border:"none", background:"none", fontSize:20, color:"#D63031" } }, "\u2715")
                    )
                  ),
                  audio ? React.createElement("div", { style:{ background:"#FBC02D", color:"#000", display:"inline-block", padding:"2px 8px", borderRadius:5, fontSize:13, fontWeight:900, margin:"5px 0" } }, "\uD83C\uDFB5 " + audio) : null,
                  (function() {
                    if (sc.type !== "baby") { return null; }
                    var isLastAct = i === plan.length - 1;
                    if (!isLastAct) { return null; }
                    var hasSurprise = desc.toLowerCase().includes("surprise") || desc.toLowerCase().includes("face paint") || desc.toLowerCase().includes("draw");
                    if (!hasSurprise) { return null; }
                    return React.createElement("div", { style:{ background:"#E17055", color:"#fff", borderRadius:12, padding:"12px 16px", margin:"8px 0", fontWeight:900, fontSize: isLive ? 22 : 15, boxShadow:"0 4px 12px rgba(225,112,85,0.4)", display:"flex", alignItems:"flex-start", gap:8 } },
                      React.createElement("span", { style:{ fontSize: isLive ? 30 : 20, flexShrink:0 } }, "\uD83C\uDF81"),
                      React.createElement("span", null, "SURPRISE: "),
                      React.createElement("span", {
                        contentEditable:true,
                        suppressContentEditableWarning:true,
                        style:{ outline:"none", borderBottom:"2px dashed rgba(255,255,255,0.5)", minWidth:100, fontStyle:"italic" },
                        onBlur:function(e){ updateAct(i, "surprise", e.target.innerText); }
                      }, a.surprise || desc.slice(0, 80))
                    );
                  })(),
                  desc ? (function() {
                    var fontSize = isLive ? (isCurrent ? 22 : 18) : 15;
                    var parts = desc.split(/\*\*([^*]+)\*\*/);
                    return React.createElement("div", { style:{ margin:"10px 0", lineHeight:2, fontSize:fontSize },
                      contentEditable:!isLive, suppressContentEditableWarning:true,
                      onBlur:function(e){ updateAct(i, "desc", e.target.innerText); }
                    },
                      parts.map(function(part, pi) {
                        if (pi % 2 === 1) {
                          return React.createElement("span", { key:pi,
                            style:{ background:"#FFF176", color:"#1a1a1a", borderRadius:4, padding:"2px 7px", marginRight:3, fontWeight:800, display:"inline-block", boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }
                          }, part);
                        }
                        return React.createElement("span", { key:pi, style:{ color: isLive ? "#2D3436" : "#636e72" } }, part);
                      })
                    );
                  })() : null,

                  React.createElement("div", { style:{ marginTop:6, display:"flex", flexWrap:"wrap", gap:5, alignItems:"center" } },
                    (materials ? materials.split(",").map(function(m){ return m.trim(); }).filter(function(m){ return m; }) : []).map(function(m, mi){
                      return React.createElement("span", { key:mi, style:{ background: isCurrent ? "#FF7675" : "#F1F2F6", color: isCurrent ? "#fff" : scColor, fontSize: isLive ? 17 : 15, fontWeight:700, padding:"4px 10px", borderRadius:20, display:"flex", alignItems:"center", gap:4 } },
                        m,
                        !isLive && React.createElement("span", { onClick:function(){
                          var arr = materials.split(",").map(function(x){ return x.trim(); }).filter(function(x){ return x; });
                          arr.splice(mi, 1);
                          updateAct(i, "materials", arr.join(", "));
                        }, style:{ cursor:"pointer", fontWeight:900, fontSize:14, opacity:0.6, marginLeft:2 } }, "×")
                      );
                    }),
                    !isLive && React.createElement("select", {
                      onChange:function(e){
                        if (!e.target.value) { return; }
                        var arr = materials ? materials.split(",").map(function(x){ return x.trim(); }).filter(function(x){ return x; }) : [];
                        if (arr.indexOf(e.target.value) === -1) { arr.push(e.target.value); }
                        updateAct(i, "materials", arr.join(", "));
                        e.target.value = "";
                      },
                      style:{ fontSize:11, borderRadius:8, border:"1px dashed #CCC", padding:"2px 6px", color:"#636e72", background:"#fff", cursor:"pointer" }
                    },
                      React.createElement("option", { value:"" }, "+ materiale"),
                      Array.from(new Set(
                        curL.map(function(a){ return safeStr(a.materials); })
                          .join(", ").split(",")
                          .map(function(m){ return m.trim(); })
                          .filter(function(m){ return m.length > 0; })
                      )).map(function(m, mi){
                        return React.createElement("option", { key:mi, value:m }, m);
                      })
                    ),
                    !isLive && React.createElement("input", {
                      type:"text", placeholder:"+ nuovo...",
                      style:{ fontSize:11, border:"1px dashed #CCC", borderRadius:8, padding:"2px 8px", width:80, color:"#636e72" },
                      onKeyDown:function(e){
                        if (e.key === "Enter" && e.target.value.trim()) {
                          var arr = materials ? materials.split(",").map(function(x){ return x.trim(); }).filter(function(x){ return x; }) : [];
                          arr.push(e.target.value.trim());
                          updateAct(i, "materials", arr.join(", "));
                          e.target.value = "";
                        }
                      }
                    })
                  )
                )
              );
            })
          ),

          bonusActs.length > 0 && React.createElement("div", { style:{ marginTop:50, padding:35, background: isLive ? "#E3F2FD" : "#FFF9DB", borderRadius:35, border:"3px dashed #FAB005" } },
            React.createElement("b", { style:{ color:"#F08C00", fontSize:18 } }, "BONUS ACTIVITIES"),
            bonusActs.map(function(b, i){
              var realIdx = curL.indexOf(b);
              return React.createElement("div", { key:i, style:{ marginTop:20, borderBottom:"1px solid #FFE58F", paddingBottom:15 } },
                React.createElement("div", { style:{ display:"flex", justifyContent:"space-between" } },
                  React.createElement("b", { style:{ fontSize:22 }, contentEditable:true, suppressContentEditableWarning:true, onBlur:function(e){ updateAct(realIdx, "name", e.target.innerText); } }, safeStr(b.name) || "Bonus"),
                  !isLive && React.createElement("button", { onClick:function(){ deleteAct(realIdx); }, style:{ border:"none", background:"none", fontSize:20, color:"#D63031", cursor:"pointer" } }, "\u2715")
                ),
                safeStr(b.audio) ? React.createElement("div", { style:{ color:"#FBC02D", fontWeight:900, margin:"5px 0" } }, "\uD83C\uDFB5 " + safeStr(b.audio)) : null,
                safeStr(b.desc) ? React.createElement("p", { style:{ fontSize:16 }, contentEditable:true, suppressContentEditableWarning:true, onBlur:function(e){ updateAct(realIdx, "desc", e.target.innerText); } }, safeStr(b.desc)) : null,
                safeStr(b.materials) ? React.createElement("div", { style:{ fontSize:12, fontWeight:700 }, contentEditable:true, suppressContentEditableWarning:true, onBlur:function(e){ updateAct(realIdx, "materials", e.target.innerText); } }, safeStr(b.materials)) : null
              );
            })
          ),

          !isLive && React.createElement("div", { style:{ marginTop:40, display:"flex", gap:10 } },
            React.createElement("button", { onClick:function(){ fr.current.click(); }, style:{ flex:4, background:"#F1F2F6", border:"3px dashed #CCC", padding:30, borderRadius:25, fontWeight:900 } }, "SCAN LESSON"),
            React.createElement("button", { onClick:function(){ addActivity(null); }, style:{ flex:1, background:scColor, color:"#fff", border:"none", borderRadius:25, fontSize:35 } }, "+"),
            clipboard ? React.createElement("button", { onClick:function(){ addActivity(clipboard); }, style:{ flex:1.5, background:"#34495E", color:"#fff", border:"none", borderRadius:25, fontSize:10, fontWeight:900 } }, "PASTE") : null,
            React.createElement("input", { type:"file", ref:fr, style:{ display:"none" }, onChange:function(e){ uploadToAI(e.target.files); } })
          )
        )
      ),
      scn && React.createElement("div", { style:{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#2F3542", color:"#fff", padding:"15px 30px", borderRadius:50, fontWeight:900, zIndex:10000 } }, ss)
    )
  );
}

export default function App() {
  var s1 = useState(null); var session = s1[0]; var setSession = s1[1];
  var s2 = useState(false); var checked = s2[0]; var setChecked = s2[1];
  var s3 = useState({}); var lessons = s3[0]; var setLessons = s3[1];
  var s4 = useState("home"); var view = s4[0]; var setView = s4[1];
  var s5 = useState(null); var sc = s5[0]; var setSc = s5[1];
  var s6 = useState(""); var sp = s6[0]; var setSp = s6[1];
  var s7 = useState(null); var sd = s7[0]; var setSd = s7[1];
  var s8 = useState(false); var scn = s8[0]; var setScn = s8[1];
  var s9 = useState(""); var ss = s9[0]; var setSs = s9[1];
  var s10 = useState(false); var syncing = s10[0]; var setSyncing = s10[1];
  var s11 = useState(null); var appClipboard = s11[0]; var setAppClipboard = s11[1];
  var importRef = useRef(null);

  var fetchLessons = function(callback) {
    supabase.from("lessons").select("key, data").then(function(res) {
      if (!res.error && res.data) {
        var merged = {};
        res.data.forEach(function(row) { merged[row.key] = row.data; });
        setLessons(merged);
        if (callback) { callback(); }
      }
    });
  };

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      var sess = res.data.session;
      if (sess) {
        setSession(sess);
        fetchLessons(function() { setChecked(true); });
      } else {
        setChecked(true);
      }
    });

    var listener = supabase.auth.onAuthStateChange(function(event, sess) {
      if (event === "SIGNED_IN") {
        setSession(sess);
        fetchLessons(null);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setLessons({});
      }
    });

    return function() { listener.data.subscription.unsubscribe(); };
  }, []);

  var handleSave = function(newL, key, data) {
    setLessons(newL);
    supabase.auth.getSession().then(function(res) {
      var sess = res.data.session;
      if (!sess) {
        setSs("Sessione scaduta - rieffettua il login");
        setScn(true);
        setTimeout(function() { setScn(false); }, 5000);
        return;
      }
      var uid = sess.user.id;
      supabase.from("lessons").delete().eq("user_id", uid).eq("key", key)
        .then(function() {
          supabase.from("lessons").insert({ user_id: uid, key: key, data: data })
            .then(function(r) {
              if (r.error) {
                setSs("Errore: " + r.error.message);
                setScn(true);
                setTimeout(function() { setScn(false); }, 5000);
              }
            });
        });
    });
  };

  var showMsg = function(msg) {
    setSs(msg); setScn(true);
    setTimeout(function() { setScn(false); }, 3000);
  };

  var exportBackup = function() {
    var blob = new Blob([JSON.stringify(lessons, null, 2)], { type:"application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "kids-us-backup-" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showMsg("Backup exported!");
  };

  var importBackup = function(file) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var parsed = JSON.parse(e.target.result);
        setSyncing(true);
        var keys = Object.keys(parsed);
        if (keys.length === 0) { setSyncing(false); return; }
        var uid = session.user.id;
        await supabase.from("lessons").delete().eq("user_id", uid);
        for (var i = 0; i < keys.length; i++) {
          await supabase.from("lessons").insert(
            { user_id: uid, key: keys[i], data: parsed[keys[i]] }
          );
        }
        setLessons(parsed);
        setSyncing(false);
        showMsg("Backup restored!");
      } catch(err) {
        setSyncing(false);
        showMsg("File non valido.");
      }
    };
    reader.readAsText(file);
  };

  if (!checked) {
    return React.createElement("div", {
      style: { minHeight:"100vh", background:"#F4F7F6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }
    }, React.createElement("div", { style:{ fontSize:40 } }, "\u23F3"));
  }

  if (!session) {
    return React.createElement(LoginScreen, null);
  }

  if (view === "lesson" && sc && sp && sd) {
    return React.createElement(LessonView, {
      sc:sc, sp:sp, sd:sd,
      lessons:lessons,
      userId:session.user.id,
      onBack:function(){ setView("course"); },
      onSave:handleSave,
      initialClipboard:appClipboard,
      onClipboardChange:setAppClipboard
    });
  }

  if (view === "course" && sc) {
    var scanContext = async function(p, fileInput) {
      var files = fileInput.files;
      if (!files || !files[0]) { return; }
      setSs("Analisi outlines & routines..."); setScn(true);
      try {
        var b64 = await new Promise(function(resolve) {
          var rd = new FileReader();
          rd.onload = function() { resolve(rd.result.split(",")[1]); };
          rd.readAsDataURL(files[0]);
        });
        setSs("AI sta leggendo...");
        var promptMsg = "Extract ALL content from this Kids&Us teacher guide page including warm-up routines, goodbye routines, objectives, choosing rhyme and any other relevant information. Return as plain structured text. Include all teacher instructions, target language, materials, songs and tracks. Do not use JSON.";
        var res = await fetch("/api/generate", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ imageB64:b64, mimeType:files[0].type || "image/jpeg", prompt:promptMsg })
        });
        var d = await res.json();
        var contextText = d.text.trim();
        var contextKey = sc.id + "|context|" + p;
        var newL = Object.assign({}, lessons);
        newL[contextKey] = contextText;
        handleSave(newL, contextKey, contextText);
        setSs("Outlines & routines salvate!");
        setTimeout(function() { setScn(false); }, 3000);
      } catch(e) {
        setSs("Errore: " + e.message);
        setTimeout(function() { setScn(false); }, 5000);
      }
    };

    return React.createElement("div", { style:{ minHeight:"100vh", background:"#F4F7F6", fontFamily:"sans-serif" } },
      React.createElement("div", { style:{ maxWidth:650, margin:"0 auto", padding:25 } },
        React.createElement("button", { onClick:function(){ setView("home"); }, style:{ background:"none", border:"none", fontWeight:900, color:sc.color, fontSize:16 } }, "\u2190 BACK"),
        React.createElement("h1", { style:{ color:sc.color } }, sc.name),
        ["Story 1","Story 2","Story 3","Story 4"].map(function(p) {
          var contextKey = sc.id + "|context|" + p;
          var hasContext = !!lessons[contextKey];
          var ref = React.createRef();
          return React.createElement("div", { key:p, style:{ background:"#fff", padding:20, borderRadius:25, marginBottom:15, color:"#333" } },
            React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 } },
              React.createElement("b", { style:{ fontSize:16 } }, p),
              React.createElement("div", { style:{ display:"flex", gap:8 } },
                React.createElement("button", {
                  onClick: function() { ref.current.click(); },
                  style:{ background: hasContext ? "#636e72" : sc.color, color:"#fff", border:"none", borderRadius:8, padding:"5px 12px", fontWeight:700, fontSize:12, cursor:"pointer" }
                }, hasContext ? "\uD83D\uDCF8 Aggiorna" : "\uD83D\uDCF8 Scan outlines & routines"),
                React.createElement("input", { type:"file", ref:ref, style:{ display:"none" }, onChange: function(e) { scanContext(p, e.target); } })
              )
            ),
            hasContext ? React.createElement("div", { style:{ background:"#F0FFF4", border:"1px solid #B2DFDB", borderRadius:10, padding:"8px 12px", fontSize:11, color:"#2D3436", marginBottom:10 } },
              React.createElement("span", { style:{ color:"#27AE60", fontWeight:900 } }, "\u2705 Outlines & routines caricate")
            ) : null,
            React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:10 } },
              Array.from({ length:10 }, function(_, i) {
                var dayKey = sc.id + "|" + p + "|" + (i+1);
                return React.createElement("button", {
                  key:i,
                  onClick:function(){ setSp(p); setSd(i+1); setView("lesson"); },
                  style:{ padding:15, borderRadius:12, border:"1px solid #EEE", background: (lessons[dayKey] && Array.isArray(lessons[dayKey]) && lessons[dayKey].length > 0) ? "#E8F5E9" : "#FFF", fontWeight:700 }
                }, i+1);
              })
            )
          );
        })
      ),
      scn ? React.createElement("div", { style:{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#2F3542", color:"#fff", padding:"15px 30px", borderRadius:50, fontWeight:900, zIndex:10000 } }, ss) : null
    );
  }

  return React.createElement("div", { style:{ minHeight:"100vh", background:"#F4F7F6", fontFamily:"sans-serif" } },
    React.createElement("div", { style:{ maxWidth:800, margin:"0 auto", padding:40 } },
      React.createElement("h1", { style:{ textAlign:"center", fontWeight:900 } }, "Kids&Us Master Planner \uD83C\uDF93"),
      React.createElement("div", { style:{ display:"flex", gap:10, justifyContent:"center", marginBottom:30, flexWrap:"wrap" } },
        React.createElement("button", { onClick:exportBackup, style:{ background:"#27AE60", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Export Backup"),
        React.createElement("button", { onClick:function(){ importRef.current.click(); }, style:{ background:"#2F3542", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Import Backup"),
        React.createElement("button", { onClick:function(){ fetchLessons(function(){ showMsg("Dati ricaricati!"); }); }, style:{ background:"#0984E3", color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "\uD83D\uDD04 Ricarica"),
        React.createElement("button", { onClick:function(){ supabase.auth.signOut(); }, style:{ background:"#DFE6E9", color:"#636e72", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer", fontSize:15 } }, "Logout"),
        React.createElement("input", { type:"file", ref:importRef, accept:".json", style:{ display:"none" }, onChange:function(e){ if(e.target.files[0]){ importBackup(e.target.files[0]); } } })
      ),
      React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20 } },
        CS.map(function(c) {
          return React.createElement("div", {
            key:c.id,
            onClick:function(){ setSc(c); setView("course"); },
            style:{ background:"#fff", padding:30, borderRadius:25, borderBottom:"8px solid " + c.color, cursor:"pointer", textAlign:"center", color:"#333" }
          },
            React.createElement("div", { style:{ fontSize:45 } }, c.em),
            React.createElement("b", null, c.name)
          );
        })
      )
    ),
    scn && React.createElement("div", { style:{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:"#2F3542", color:"#fff", padding:"15px 30px", borderRadius:50, fontWeight:900, zIndex:10000 } }, ss),
    syncing && React.createElement("div", { style:{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:20000 } },
      React.createElement("div", { style:{ background:"#fff", padding:30, borderRadius:20, fontWeight:900, fontSize:18 } }, "Syncing...")
    )
  );
}
