import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

var supabase = createClient(
"https://zuaalqhbesywmfvuvgho.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YWFscWhiZXN5d21mdnV2Z2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODM1OTksImV4cCI6MjA4OTM1OTU5OX0.9drUMBRWudHc_jh3n0pJaybr2qKZUCQvAezuGzb2pGI"
);

var CS = [
{id:"mousy",name:"Mousy",color:"#8CB43B",em:"\u{1F42D}"},
{id:"linda",name:"Linda",color:"#F26522",em:"\u{1F431}"},
{id:"sam",name:"Sam",color:"#00B3B0",em:"\u{1F9F8}"},
{id:"emma",name:"Emma",color:"#E878A0",em:"\u{1F98B}"},
{id:"oliver",name:"Oliver",color:"#00B3B0",em:"\u{1F438}"},
{id:"marcia",name:"Marcia",color:"#E94E58",em:"\u{1F380}"},
{id:"pam",name:"Pam & Paul",color:"#FFD700",em:"\u{1F46B}"},
{id:"ben",name:"Ben & Brenda",color:"#4B0082",em:"\u{1F9D1}"}
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
type: "email", placeholder: "Email", value: email,
onChange: function(e) { setEmail(e.target.value); },
style: { width:"100%", padding:"12px 15px", borderRadius:12, border:"1px solid #DDD", fontSize:15, marginBottom:12, boxSizing:"border-box" }
}),
React.createElement("input", {
type: "password", placeholder: "Password", value: password,
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

function HomeScreen(props) {
var session = props.session;
var lessons = props.lessons;

return React.createElement("div", {
style: { minHeight:"100vh", background:"#F4F7F6", fontFamily:"sans-serif" }
},
React.createElement("div", { style: { maxWidth:800, margin:"0 auto", padding:40 } },
React.createElement("h1", { style: { textAlign:"center", fontWeight:900 } }, "Kids&Us Master Planner \uD83C\uDF93"),
React.createElement("p", { style: { textAlign:"center", color:"#636e72", marginBottom:10 } }, session.user.email),
React.createElement("p", { style: { textAlign:"center", color:"#00B894", fontWeight:900, marginBottom:30 } }, "Lezioni caricate: " + Object.keys(lessons).length),
React.createElement("div", { style: { display:"flex", gap:10, justifyContent:"center", marginBottom:30 } },
React.createElement("button", {
onClick: function() { supabase.auth.signOut(); },
style: { background:"#DFE6E9", color:"#636e72", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:900, cursor:"pointer" }
}, "Logout")
),
React.createElement("div", { style: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:20 } },
CS.map(function(c) {
return React.createElement("div", {
key: c.id,
style: { background:"#fff", padding:30, borderRadius:25, borderBottom:"8px solid " + c.color, textAlign:"center", color:"#333" }
},
React.createElement("div", { style: { fontSize:45 } }, c.em),
React.createElement("b", null, c.name)
);
})
)
)
);
}

export default function App() {
var s1 = useState(null); var session = s1[0]; var setSession = s1[1];
var s2 = useState(false); var checked = s2[0]; var setChecked = s2[1];
var s3 = useState({}); var lessons = s3[0]; var setLessons = s3[1];

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

useEffect(function() {
if (!session) { return; }
supabase.from("lessons").select("key, data").then(function(res) {
if (!res.error && res.data) {
var merged = {};
res.data.forEach(function(row) { merged[row.key] = row.data; });
setLessons(merged);
}
});
}, [session]);

if (!checked) {
return React.createElement("div", {
style: { minHeight:"100vh", background:"#F4F7F6", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }
}, React.createElement("div", { style: { fontSize:40 } }, "\u23F3"));
}

if (!session) {
return React.createElement(LoginScreen, null);
}

return React.createElement(HomeScreen, { session: session, lessons: lessons });
}