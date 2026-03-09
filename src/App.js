import { useState, useEffect } from "react";

/* ── Google Fonts ─────────────────────────────────────────────────────────── */
const _fl = document.createElement("link");
_fl.rel = "stylesheet";
_fl.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap";
document.head.appendChild(_fl);

/* ── Global CSS ───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #EEF4FB; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #B8CFEA; border-radius: 99px; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.93); } to { opacity:1; transform:scale(1); } }

  .nav-item { transition: all .2s ease; }
  .nav-item:hover { background: rgba(255,255,255,.12) !important; color: #fff !important; }
  .nav-item.active { background: rgba(255,255,255,.18) !important; color: #fff !important; box-shadow: inset 3px 0 0 #93C5FD !important; }

  .stat-card { transition: all .25s ease; }
  .stat-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 48px rgba(59,130,246,.18) !important; }

  .history-row { transition: background .15s ease; }
  .history-row:hover { background: #DDEAF8 !important; }

  .upload-zone { transition: all .2s ease; }
  .upload-zone:hover { border-color: #3B82F6 !important; background: #E8F1FB !important; }

  .skill-tag { transition: transform .15s ease; cursor: default; }
  .skill-tag:hover { transform: scale(1.06); }

  .cta-btn { transition: all .22s ease; }
  .cta-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 12px 36px rgba(59,130,246,.42) !important; }

  .ghost-btn { transition: all .2s ease; }
  .ghost-btn:hover { border-color: #3B82F6 !important; color: #3B82F6 !important; background: #EEF4FB !important; }

  select:focus, textarea:focus, input:focus {
    outline: none !important;
    border-color: #60A5FA !important;
    box-shadow: 0 0 0 3px rgba(96,165,250,.2) !important;
  }
`;

function StyleTag() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch {} };
  }, []);
  return null;
}

/* ── Palette ──────────────────────────────────────────────────────────────── */
const C = {
  pageBg: "#EEF4FB",
  cardBg: "#FFFFFF",
  cardBlueTint: "#F5F9FF",
  sidebar: "#1E3A5F",
  sidebarDeep: "#152C4A",
  blue: "#3B82F6",
  blueMid: "#60A5FA",
  bluePale: "#DBEAFE",
  blueGhost: "#EFF6FF",
  periwinkle: "#818CF8",
  periPale: "#EEF2FF",
  sky: "#38BDF8",
  skyPale: "#E0F2FE",
  teal: "#0EA5E9",
  tealPale: "#E0F2FE",
  amber: "#F59E0B",
  amberPale: "#FEF3C7",
  red: "#EF4444",
  redPale: "#FEE2E2",
  text: "#0F1E35",
  textMid: "#3D5A80",
  textLight: "#7090B0",
  border: "#D1E3F5",
  borderDark: "#A8C4E0",
};

/* ── Score helpers ────────────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return C.blue;
  if (s >= 60) return C.amber;
  return C.red;
}
function scoreBg(s) {
  if (s >= 80) return C.bluePale;
  if (s >= 60) return C.amberPale;
  return C.redPale;
}
function scoreLabel(s) {
  if (s >= 80) return "Strong Match";
  if (s >= 60) return "Good Match";
  if (s >= 40) return "Partial Match";
  return "Weak Match";
}

/* ── API — calls our Netlify function (safe, key never exposed) ───────────── */
async function callAPI(payload) {
  // In production this hits /.netlify/functions/claude via the redirect rule
  // In local dev with `netlify dev`, same path works automatically
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function callClaude(system, user) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content: user }],
  });
  return data.content?.map(b => b.text || "").join("\n") || "";
}

async function extractTextFromPDF(b64) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: "Extract ALL text from this resume PDF. Return only the raw text, no commentary or markdown." },
      ],
    }],
  });
  return data.content?.map(b => b.text || "").join("\n") || "";
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

/* ── Static data ──────────────────────────────────────────────────────────── */
const JOB_ROLES = [
  "Data Scientist","Product Manager","UX/UI Designer","DevOps Engineer",
  "Cybersecurity Analyst","Marketing Manager","Financial Analyst",
  "Machine Learning Engineer","Project Manager","Business Analyst",
  "Frontend Developer","Backend Developer","Full Stack Developer",
  "Cloud Architect","HR Manager","Sales Manager","Content Strategist",
  "Blockchain Developer","Mobile App Developer","QA Engineer",
];

const INIT_HISTORY = [
  { id:1, role:"Data Scientist",    date:"Mar 9, 2026",  score:82 },
  { id:2, role:"UX/UI Designer",    date:"Mar 8, 2026",  score:67 },
  { id:3, role:"Product Manager",   date:"Mar 7, 2026",  score:91 },
  { id:4, role:"DevOps Engineer",   date:"Mar 6, 2026",  score:54 },
  { id:5, role:"Financial Analyst", date:"Mar 5, 2026",  score:78 },
];

/* ── Score Ring ───────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 100 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${col}22`} strokeWidth={10}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={col} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition:"stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 6px ${col}88)` }}
      />
    </svg>
  );
}

function ScoreBadge({ score }) {
  return (
    <span style={{
      background: scoreBg(score), color: scoreColor(score),
      borderRadius: 20, padding: "3px 13px", fontWeight: 700,
      fontSize: 13, fontFamily: "'Outfit',sans-serif",
      border: `1px solid ${scoreColor(score)}44`,
    }}>{score}%</span>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
const NAV = [
  { id:"dashboard", label:"Dashboard",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id:"analyze", label:"Analyze Resume",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id:"history", label:"History",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];

function Sidebar({ page, setPage }) {
  return (
    <div style={{
      width:252, background:`linear-gradient(180deg,${C.sidebar},${C.sidebarDeep})`,
      display:"flex", flexDirection:"column", flexShrink:0,
      minHeight:"100vh", position:"sticky", top:0,
      boxShadow:"4px 0 24px rgba(30,58,95,.22)",
    }}>
      <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 70%)", pointerEvents:"none" }}/>

      <div style={{ padding:"30px 26px 28px", borderBottom:"1px solid rgba(255,255,255,.08)", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, background:"linear-gradient(135deg,#60A5FA,#3B82F6)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(59,130,246,.55)" }}>
            <svg width="21" height="21" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
              <line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:19, color:"#fff" }}>ResumeAI</div>
            <div style={{ fontSize:9, color:"rgba(147,197,253,.6)", letterSpacing:"1.6px", textTransform:"uppercase", marginTop:1 }}>Career Intelligence</div>
          </div>
        </div>
      </div>

      <nav style={{ padding:"22px 14px", flex:1 }}>
        <div style={{ fontSize:9, fontWeight:700, color:"rgba(147,197,253,.4)", letterSpacing:"2px", textTransform:"uppercase", padding:"0 12px", marginBottom:10 }}>Menu</div>
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} className={`nav-item${active?" active":""}`} onClick={()=>setPage(n.id)} style={{
              width:"100%", background:active?"rgba(255,255,255,.15)":"transparent",
              border:"none", borderRadius:11, color:active?"#fff":"rgba(147,197,253,.65)",
              textAlign:"left", padding:"12px 14px", cursor:"pointer", fontSize:14,
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:active?600:400,
              display:"flex", alignItems:"center", gap:11, marginBottom:4,
              boxShadow:active?"inset 3px 0 0 #93C5FD":"none",
            }}>{n.icon}{n.label}</button>
          );
        })}
      </nav>

      <div style={{ padding:"18px 26px 24px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
        <div style={{ background:"rgba(255,255,255,.06)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(147,197,253,.12)" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(147,197,253,.7)", marginBottom:2 }}>Powered by Claude AI</div>
          <div style={{ fontSize:10, color:"rgba(147,197,253,.3)" }}>© 2026 ResumeAI</div>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
function DashboardPage({ history, setPage }) {
  const avg  = history.length ? Math.round(history.reduce((a,h)=>a+h.score,0)/history.length) : 0;
  const best = history.length ? Math.max(...history.map(h=>h.score)) : 0;
  const stats = [
    { label:"Analyses Run",    value:history.length, sub:"total sessions",   icon:"📊", dark:true  },
    { label:"Resumes Saved",   value:history.length, sub:"in your history",  icon:"📄", dark:false },
    { label:"Avg Match Score", value:`${avg}%`,       sub:"across all roles", icon:"🎯", dark:true  },
    { label:"Best Score",      value:`${best}%`,      sub:"your top result",  icon:"🏆", dark:false },
  ];
  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:38 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.blueMid, letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>Overview</div>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:36, fontWeight:800, color:C.text, letterSpacing:"-.7px" }}>Dashboard</h1>
          <p style={{ color:C.textMid, marginTop:8, fontSize:14 }}>Track your resume performance at a glance</p>
        </div>
        <button className="cta-btn" onClick={()=>setPage("analyze")} style={{
          background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"#fff", border:"none",
          borderRadius:13, padding:"13px 26px", fontWeight:700, fontSize:14,
          fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:"pointer",
          boxShadow:"0 6px 22px rgba(59,130,246,.38)", display:"flex", alignItems:"center", gap:8,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Analysis
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18, marginBottom:40 }}>
        {stats.map((s,i)=>(
          <div key={s.label} className="stat-card" style={{
            background:s.dark?`linear-gradient(135deg,${C.sidebar},${C.sidebarDeep})`:C.cardBg,
            borderRadius:18, padding:"22px 20px 20px",
            border:`1px solid ${s.dark?"transparent":C.border}`,
            boxShadow:s.dark?"0 8px 30px rgba(30,58,95,.28)":"0 2px 14px rgba(59,130,246,.07)",
            animation:`fadeUp .5s ${i*.07}s ease both`,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1.2px", textTransform:"uppercase", color:s.dark?"rgba(147,197,253,.5)":C.textLight }}>{s.label}</span>
              <div style={{ width:34, height:34, borderRadius:10, background:s.dark?"rgba(255,255,255,.1)":C.blueGhost, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:34, fontWeight:800, lineHeight:1, color:s.dark?"#fff":C.text }}>{s.value}</div>
            <div style={{ fontSize:12, marginTop:7, color:s.dark?"rgba(147,197,253,.45)":C.textLight }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:20, fontWeight:700, color:C.text }}>Recent Analyses</h2>
        <button onClick={()=>setPage("history")} style={{ background:"none", border:"none", color:C.blue, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>View all →</button>
      </div>

      <div style={{ background:C.cardBg, borderRadius:18, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
        {history.slice(0,5).map((h,i)=>(
          <div key={h.id} className="history-row" style={{
            display:"flex", alignItems:"center", justifyContent:"space-between", padding:"17px 26px",
            borderBottom:i<Math.min(4,history.length-1)?`1px solid ${C.border}`:"none",
            animation:`fadeUp .4s ${i*.06}s ease both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:scoreBg(h.score), border:`1.5px solid ${scoreColor(h.score)}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:13, color:scoreColor(h.score) }}>{h.score}%</div>
              <div>
                <div style={{ fontWeight:600, color:C.text, fontSize:15 }}>{h.role}</div>
                <div style={{ color:C.textLight, fontSize:12, marginTop:2 }}>{h.date}</div>
              </div>
            </div>
            <span style={{ fontSize:11, fontWeight:600, color:scoreColor(h.score), background:scoreBg(h.score), padding:"4px 13px", borderRadius:20, border:`1px solid ${scoreColor(h.score)}33` }}>{scoreLabel(h.score)}</span>
          </div>
        ))}
        {history.length===0&&<div style={{ padding:"52px", textAlign:"center", color:C.textLight }}><div style={{ fontSize:40, marginBottom:12 }}>📂</div><p>No analyses yet.</p></div>}
      </div>
    </div>
  );
}

/* ── Analyze Page ─────────────────────────────────────────────────────────── */
function AnalyzePage({ onResult }) {
  const [pdfFile,setPdfFile]=useState(null);
  const [resumeText,setResumeText]=useState("");
  const [extracting,setExtracting]=useState(false);
  const [jobDesc,setJobDesc]=useState("");
  const [selRole,setSelRole]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [dragOver,setDragOver]=useState(false);

  async function handleFile(file){
    if(!file||file.type!=="application/pdf"){alert("Please upload a PDF.");return;}
    setPdfFile(file);setResumeText("");setExtracting(true);
    try{const b64=await fileToBase64(file);const text=await extractTextFromPDF(b64);setResumeText(text);}
    catch{alert("Could not read PDF.");}
    setExtracting(false);
  }

  async function handleAnalyze(){
    if(!resumeText.trim()){alert("Upload a resume PDF first.");return;}
    if(!selRole&&!jobDesc.trim()){alert("Select a role or enter a job description.");return;}
    setLoading(true);setResult(null);
    const jd=jobDesc.trim()||`Standard description for ${selRole}`;
    const role=selRole||"the specified role";
    const sys=`You are an expert ATS and career coach. Analyze resumes. Return ONLY valid JSON:
{"score":<0-100>,"summary":"<2-3 sentences>","strengths":["...","...","..."],"gaps":["...","...","..."],"skills_matched":["...","...","..."],"skills_missing":["...","..."],"recommendations":["...","...","..."]}`;
    try{
      const raw=await callClaude(sys,`Role: ${role}\nJob: ${jd}\n\nResume:\n${resumeText}\n\nJSON only.`);
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const date=new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
      setResult({...parsed,role,date});onResult({...parsed,role,date});
    }catch{alert("Analysis failed.");}
    setLoading(false);
  }

  const canAnalyze=!!resumeText&&!loading&&!extracting&&(!!selRole||!!jobDesc.trim());
  if(result)return<ResultView result={result} onReset={()=>{setResult(null);setPdfFile(null);setResumeText("");}}/>;

  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.blueMid, letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>New Analysis</div>
        <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:36, fontWeight:800, color:C.text, letterSpacing:"-.7px" }}>Analyze Resume</h1>
        <p style={{ color:C.textMid, marginTop:8, fontSize:14 }}>Upload your PDF and pick a target role — our AI does the rest</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:30 }}>
        {/* PDF Upload */}
        <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, padding:28, boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:34, height:34, background:C.blueGhost, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" fill="none" stroke={C.blue} strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:C.text }}>Your Resume</h3>
          </div>
          {!pdfFile?(
            <div className="upload-zone"
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);}}
              onClick={()=>document.getElementById("pdf-inp").click()}
              style={{ border:`2px dashed ${dragOver?C.blue:C.borderDark}`, borderRadius:16, padding:"48px 24px", textAlign:"center", cursor:"pointer", background:dragOver?C.blueGhost:C.cardBlueTint }}
            >
              <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#DBEAFE,#EFF6FF)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", boxShadow:"0 4px 14px rgba(59,130,246,.15)" }}>
                <svg width="30" height="30" fill="none" stroke={C.blue} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p style={{ fontWeight:700, color:C.text, fontSize:15, marginBottom:6 }}>Drop your PDF here</p>
              <p style={{ color:C.textLight, fontSize:13, marginBottom:20 }}>or click to browse files</p>
              <span style={{ background:"linear-gradient(135deg,#3B82F6,#2563EB)", color:"#fff", borderRadius:10, padding:"10px 26px", fontSize:13, fontWeight:700, boxShadow:"0 4px 14px rgba(59,130,246,.35)" }}>Choose PDF</span>
              <input id="pdf-inp" type="file" accept="application/pdf" style={{ display:"none" }} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}}/>
            </div>
          ):(
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", border:`1px solid ${C.bluePale}`, borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#3B82F6,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(59,130,246,.3)" }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, color:C.blue, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pdfFile.name}</p>
                  <p style={{ color:C.blueMid, fontSize:11, marginTop:1 }}>{(pdfFile.size/1024).toFixed(1)} KB</p>
                </div>
                <button onClick={()=>{setPdfFile(null);setResumeText("");}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, fontSize:20, lineHeight:1 }}>×</button>
              </div>
              {extracting?(
                <div style={{ textAlign:"center", padding:"30px 0", color:C.textMid }}>
                  <div style={{ width:36, height:36, border:`3px solid ${C.bluePale}`, borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 14px", boxShadow:`0 0 12px ${C.blue}44` }}/>
                  <p style={{ fontSize:13, fontWeight:600 }}>Extracting text from PDF…</p>
                  <p style={{ fontSize:12, color:C.textLight, marginTop:4 }}>This may take a few seconds</p>
                </div>
              ):(
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:".8px" }}>Extracted Text</label>
                    <span style={{ fontSize:11, color:C.blue, fontWeight:700, background:C.blueGhost, padding:"2px 10px", borderRadius:20, border:`1px solid ${C.bluePale}` }}>{resumeText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <textarea value={resumeText} onChange={e=>setResumeText(e.target.value)} style={{ width:"100%", height:192, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px", fontSize:12, resize:"vertical", fontFamily:"monospace", color:C.textMid, background:C.cardBlueTint, lineHeight:1.65 }}/>
                  <p style={{ fontSize:11, color:C.textLight, marginTop:5 }}>You may edit the extracted text if needed</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Target Role */}
        <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, padding:28, boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:34, height:34, background:C.periPale, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" fill="none" stroke={C.periwinkle} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:C.text }}>Target Role</h3>
          </div>
          <label style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:".8px", display:"block", marginBottom:8 }}>Job Role</label>
          <select value={selRole} onChange={e=>setSelRole(e.target.value)} style={{ width:"100%", padding:"11px 14px", border:`1.5px solid ${C.border}`, borderRadius:11, fontSize:14, color:selRole?C.text:C.textLight, background:C.cardBlueTint, marginBottom:22, fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:"pointer" }}>
            <option value="">— Select a role —</option>
            {JOB_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:".8px" }}>Job Description</label>
            <span style={{ fontSize:10, color:C.textLight, background:C.pageBg, padding:"2px 9px", borderRadius:20, border:`1px solid ${C.border}` }}>optional</span>
          </div>
          <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste a specific job description for a more precise match…" style={{ width:"100%", height:210, border:`1.5px solid ${C.border}`, borderRadius:11, padding:"12px 14px", fontSize:13, resize:"vertical", fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text, background:C.cardBlueTint, lineHeight:1.65 }}/>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center" }}>
        <button className="cta-btn" onClick={handleAnalyze} disabled={!canAnalyze} style={{
          background:canAnalyze?"linear-gradient(135deg,#3B82F6,#2563EB)":"#B8CFEA",
          color:"#fff", border:"none", borderRadius:15, padding:"16px 64px",
          fontWeight:800, fontSize:16, fontFamily:"'Plus Jakarta Sans',sans-serif",
          cursor:canAnalyze?"pointer":"not-allowed", display:"flex", alignItems:"center", gap:12,
          boxShadow:canAnalyze?"0 6px 24px rgba(59,130,246,.38)":"none",
        }}>
          {loading?(<><div style={{ width:20, height:20, border:"2.5px solid rgba(255,255,255,.35)", borderTop:"2.5px solid #fff", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>Analyzing…</>):(<><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Analyze Resume</>)}
        </button>
      </div>
    </div>
  );
}

/* ── Result View ──────────────────────────────────────────────────────────── */
function ResultView({ result, onReset }) {
  const { score, summary, strengths, gaps, skills_matched, skills_missing, recommendations, role, date } = result;
  const col = scoreColor(score);
  return (
    <div style={{ animation:"scaleIn .45s ease both" }}>
      <div style={{ background:`linear-gradient(135deg,${C.sidebar} 0%,#0F2942 50%,#1A3A6B 100%)`, borderRadius:22, padding:"34px 38px", marginBottom:24, boxShadow:"0 10px 48px rgba(30,58,95,.35)", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-50, top:-60, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,.14) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ flex:1, zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(147,197,253,.5)", letterSpacing:"1.8px", textTransform:"uppercase", marginBottom:10 }}>Analysis Result · {date}</div>
          <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:30, fontWeight:800, marginBottom:13 }}>{role}</h2>
          <p style={{ fontSize:14.5, color:"rgba(191,219,254,.75)", lineHeight:1.78, maxWidth:500 }}>{summary}</p>
        </div>
        <div style={{ textAlign:"center", zIndex:1, flexShrink:0, marginLeft:36 }}>
          <div style={{ position:"relative", width:100, height:100, margin:"0 auto" }}>
            <ScoreRing score={score} size={100}/>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:24, fontWeight:800, color:col, lineHeight:1 }}>{score}</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:2 }}>/ 100</span>
            </div>
          </div>
          <div style={{ marginTop:11, fontSize:11, fontWeight:700, color:col, background:"rgba(255,255,255,.09)", padding:"5px 16px", borderRadius:20 }}>{scoreLabel(score)}</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <DetailCard title="Strengths" dotColor={C.blue} items={strengths}/>
        <DetailCard title="Gaps to Address" dotColor={C.red} items={gaps}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <SkillsCard title="Skills Matched" skills={skills_matched} color={C.blue} bg={C.bluePale}/>
        <SkillsCard title="Skills Missing" skills={skills_missing} color={C.red} bg={C.redPale}/>
      </div>

      <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, padding:28, marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <div style={{ width:34, height:34, background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>💡</div>
          <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:C.text }}>Recommendations</h3>
        </div>
        {recommendations?.map((r,i)=>(
          <div key={i} style={{ display:"flex", gap:14, padding:"13px 0", borderBottom:i<recommendations.length-1?`1px solid ${C.border}`:"none", alignItems:"flex-start" }}>
            <div style={{ width:27, height:27, borderRadius:8, background:"linear-gradient(135deg,#3B82F6,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0, marginTop:1, boxShadow:"0 2px 8px rgba(59,130,246,.3)" }}>{i+1}</div>
            <p style={{ margin:0, color:C.textMid, fontSize:14, lineHeight:1.72 }}>{r}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"center" }}>
        <button className="ghost-btn" onClick={onReset} style={{ background:"#fff", color:C.textMid, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"13px 36px", fontWeight:600, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:9 }}>
          ← Analyze Another Resume
        </button>
      </div>
    </div>
  );
}

function DetailCard({ title, dotColor, items }) {
  return (
    <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, padding:26, boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
      <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</h3>
      {items?.map((item,i)=>(
        <div key={i} style={{ display:"flex", gap:11, alignItems:"flex-start", padding:"9px 0", borderBottom:i<items.length-1?`1px solid ${C.pageBg}`:"none" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:dotColor, flexShrink:0, marginTop:6, boxShadow:`0 0 5px ${dotColor}66` }}/>
          <p style={{ margin:0, color:C.textMid, fontSize:13.5, lineHeight:1.65 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function SkillsCard({ title, skills, color, bg }) {
  return (
    <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, padding:26, boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
      <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:15, fontWeight:700, color:C.text, marginBottom:14 }}>{title}</h3>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {skills?.map((s,i)=>(
          <span key={i} className="skill-tag" style={{ background:bg, color, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, border:`1px solid ${color}33` }}>{s}</span>
        ))}
        {(!skills||skills.length===0)&&<span style={{ color:C.textLight, fontSize:13 }}>None identified</span>}
      </div>
    </div>
  );
}

/* ── History Page ─────────────────────────────────────────────────────────── */
function HistoryPage({ history }) {
  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.blueMid, letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>Records</div>
        <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:36, fontWeight:800, color:C.text, letterSpacing:"-.7px" }}>History</h1>
        <p style={{ color:C.textMid, marginTop:8, fontSize:14 }}>All your past resume analyses in one place</p>
      </div>
      <div style={{ background:C.cardBg, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 2px 14px rgba(59,130,246,.07)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.4fr 1fr 1.4fr", padding:"14px 28px", background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderBottom:`1px solid ${C.border}`, fontSize:10, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"1.2px" }}>
          <span>Job Role</span><span>Date</span><span>Score</span><span>Status</span>
        </div>
        {history.map((h,i)=>(
          <div key={h.id} className="history-row" style={{ display:"grid", gridTemplateColumns:"2fr 1.4fr 1fr 1.4fr", padding:"17px 28px", alignItems:"center", borderBottom:i<history.length-1?`1px solid ${C.border}`:"none", animation:`fadeUp .4s ${i*.05}s ease both` }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:scoreColor(h.score), flexShrink:0, boxShadow:`0 0 6px ${scoreColor(h.score)}77` }}/>
              <span style={{ fontWeight:600, color:C.text, fontSize:14 }}>{h.role}</span>
            </div>
            <span style={{ color:C.textLight, fontSize:13 }}>{h.date}</span>
            <ScoreBadge score={h.score}/>
            <span style={{ fontSize:11, fontWeight:700, color:scoreColor(h.score), background:scoreBg(h.score), padding:"4px 13px", borderRadius:20, border:`1px solid ${scoreColor(h.score)}33`, display:"inline-block" }}>{scoreLabel(h.score)}</span>
          </div>
        ))}
        {history.length===0&&<div style={{ padding:"52px 32px", textAlign:"center", color:C.textLight }}><div style={{ fontSize:44, marginBottom:14 }}>📂</div><p style={{ fontWeight:600 }}>No analyses yet</p></div>}
      </div>
    </div>
  );
}

/* ── App Root ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [page,setPage]=useState("dashboard");
  const [history,setHistory]=useState(INIT_HISTORY);
  const [nextId,setNextId]=useState(6);

  function handleResult(r){
    setHistory(prev=>[{id:nextId,role:r.role,date:r.date,score:r.score},...prev]);
    setNextId(n=>n+1);
  }

  return (
    <>
      <StyleTag/>
      <div style={{ display:"flex", minHeight:"100vh", background:C.pageBg, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <Sidebar page={page} setPage={setPage}/>
        <main style={{ flex:1, padding:"44px 52px", maxWidth:1000, overflow:"auto" }}>
          {page==="dashboard"&&<DashboardPage history={history} setPage={setPage}/>}
          {page==="analyze"  &&<AnalyzePage   onResult={handleResult}/>}
          {page==="history"  &&<HistoryPage   history={history}/>}
        </main>
      </div>
    </>
  );
}
