import { useState, useEffect } from "react";

/* ── FONTS ─────────────────────────────────────────────────────────────────── */
const _fl = document.createElement("link");
_fl.rel = "stylesheet";
_fl.href = "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap";
document.head.appendChild(_fl);

/* ── GLOBAL CSS ─────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; overflow: hidden; }
  body { font-family: 'Inter', sans-serif; background: #F5F3FF; color: #1E1040; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #EDE9FE; }
  ::-webkit-scrollbar-thumb { background: #C4B5FD; border-radius: 99px; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.93); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 20px #7C3AED40} 50%{box-shadow:0 0 40px #7C3AED70} }
  @keyframes slideIn { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }

  .nav-btn { transition: all .2s ease; border-radius: 12px; }
  .nav-btn:hover { background: rgba(124,58,237,.1) !important; color: #6D28D9 !important; }
  .nav-btn.active { background: rgba(124,58,237,.15) !important; color: #5B21B6 !important; }

  .card { transition: transform .25s ease, box-shadow .25s ease; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(124,58,237,.15) !important; }

  .row-hover { transition: background .15s ease; }
  .row-hover:hover { background: rgba(124,58,237,.05) !important; }

  .upload-zone { transition: all .2s ease; }
  .upload-zone:hover, .upload-zone.drag { border-color: #7C3AED !important; background: rgba(124,58,237,.05) !important; }

  .btn-primary { transition: all .22s ease; }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(124,58,237,.45) !important; }
  .btn-primary:disabled { opacity: .4; cursor: not-allowed; }

  .btn-ghost { transition: all .2s ease; }
  .btn-ghost:hover { background: rgba(124,58,237,.08) !important; border-color: #7C3AED !important; color: #6D28D9 !important; }

  .skill-chip { transition: transform .15s ease; }
  .skill-chip:hover { transform: scale(1.06); }

  select:focus, textarea:focus, input:focus {
    outline: none !important;
    border-color: #7C3AED !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,.18) !important;
  }

  textarea::placeholder { color: #A78BFA; }
  select option { background: #ffffff; color: #1E1040; }
`;

function StyleTag() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch { } };
  }, []);
  return null;
}

/* ── COLOR PALETTE ──────────────────────────────────────────────────────────── */
const C = {
  // Backgrounds — light lavender
  bg: "#F5F3FF",   // soft lavender page bg
  bgCard: "#FFFFFF",   // pure white cards
  bgRaised: "#F0EBFF",   // slightly raised elements
  bgHover: "#EDE9FE",   // hover state bg

  // Brand purple/violet
  brand: "#7C3AED",   // main violet
  brandHover: "#6D28D9",   // deeper on hover
  brandDeep: "#5B21B6",   // darkest purple
  brandGlow: "#7C3AED30", // glow effect

  // Accents
  accent: "#8B5CF6",   // medium violet
  accentSoft: "#A78BFA",   // soft violet

  // Score colors — adjusted for light bg
  green: "#15803D",
  greenPale: "#DCFCE7",
  greenBorder: "#15803D33",
  amber: "#B45309",
  amberPale: "#FEF3C7",
  amberBorder: "#B4530933",
  red: "#B91C1C",
  redPale: "#FEE2E2",
  redBorder: "#B91C1C33",

  // Text — dark for light bg
  textBright: "#1E1040",
  text: "#3B1F6E",
  textMid: "#6D28D9",
  textDim: "#A78BFA",

  // Borders
  border: "#E9D5FF",
  borderMid: "#DDD6FE",
  borderBright: "#C4B5FD",
};

/* ── SCORE HELPERS ──────────────────────────────────────────────────────────── */
function scoreColor(s) { return s >= 70 ? C.green : s >= 45 ? C.amber : C.red; }
function scoreBg(s) { return s >= 70 ? C.greenPale : s >= 45 ? C.amberPale : C.redPale; }
function scoreBorder(s) { return s >= 70 ? C.greenBorder : s >= 45 ? C.amberBorder : C.redBorder; }
function scoreLabel(s) { return s >= 85 ? "Strong Match" : s >= 70 ? "Good Match" : s >= 45 ? "Partial Match" : "Weak Match"; }

/* ── API ────────────────────────────────────────────────────────────────────── */
async function callAPI(payload) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
async function callClaude(system, user) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: user }],
  });
  return data.content?.map(b => b.text || "").join("\n") || "";
}
async function extractTextFromPDF(b64) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: "Extract ALL text from this resume PDF. Return only the raw text, no commentary." },
      ],
    }],
  });
  return data.content?.map(b => b.text || "").join("\n") || "";
}
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("fail"));
    r.readAsDataURL(file);
  });
}

/* ── STATIC DATA ────────────────────────────────────────────────────────────── */
const JOB_ROLES = [
  "Data Scientist", "Product Manager", "UX/UI Designer", "DevOps Engineer",
  "Cybersecurity Analyst", "Marketing Manager", "Financial Analyst",
  "Machine Learning Engineer", "Project Manager", "Business Analyst",
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Cloud Architect", "HR Manager", "Sales Manager", "Content Strategist",
  "Blockchain Developer", "Mobile App Developer", "QA Engineer",
];

// History is loaded from persistent storage — no fake data needed

/* ── ICONS ──────────────────────────────────────────────────────────────────── */
const Icon = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  analyze: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  history: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  upload: <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  file: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  search: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  target: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  plus: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  bulb: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17H9v-2.8C7.21 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" /></svg>,
};

/* ── SCORE RING ─────────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 120 }) {
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${col}18`} strokeWidth={12} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={12}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 10px ${col}99)` }} />
    </svg>
  );
}

/* ── SIDEBAR ────────────────────────────────────────────────────────────────── */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
  { id: "analyze", label: "Analyze Resume", icon: Icon.analyze },
  { id: "history", label: "History", icon: Icon.history },
];

function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <>
      {/* Collapsed rail — always visible, shows toggle + icon-only nav */}
      <div style={{
        width: 56, flexShrink: 0, background: "linear-gradient(160deg,#F0EBFF 0%,#EDE9FE 100%)",
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        height: "100vh", zIndex: 50, position: "relative",
      }}>
        {/* Hamburger / toggle button */}
        <button
          onClick={() => setOpen(true)}
          title="Open menu"
          style={{
            marginTop: 18, width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
            border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            boxShadow: `0 4px 14px ${C.brandGlow}`, flexShrink: 0,
          }}>
          <span style={{ width: 14, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
          <span style={{ width: 14, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
          <span style={{ width: 14, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
        </button>

        {/* Icon-only nav dots */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", flex: 1 }}>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id}
                onClick={() => setPage(n.id)}
                title={n.label}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: active ? `rgba(124,58,237,.18)` : "transparent",
                  color: active ? C.brand : C.textDim,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s ease",
                }}>
                {n.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(30,16,64,.25)",
            zIndex: 99, backdropFilter: "blur(2px)",
            animation: "fadeUp .2s ease both",
          }}
        />
      )}

      {/* Slide-out full sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: 0, height: "100vh", width: 240,
        background: "linear-gradient(160deg,#F0EBFF 0%,#EDE9FE 100%)",
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        zIndex: 100, overflow: "hidden",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .28s cubic-bezier(.4,0,.2,1)",
        boxShadow: open ? "6px 0 40px rgba(124,58,237,.15)" : "none",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: .04,
          backgroundImage: "linear-gradient(#7C3AED 1px,transparent 1px),linear-gradient(90deg,#7C3AED 1px,transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />

        {/* Logo + close button */}
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.border}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${C.brandGlow}`, flexShrink: 0,
              animation: "glow 3s ease-in-out infinite",
            }}>{Icon.file}</div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: C.textBright, letterSpacing: "-.3px" }}>SkillMatch</div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: "2px", textTransform: "uppercase", marginTop: 1 }}>Skill Intelligence</div>
            </div>
          </div>
          {/* Close ← arrow */}
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.bgCard, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: C.textMid,
              fontSize: 16, fontWeight: 600, flexShrink: 0,
            }}>‹</button>
        </div>

        {/* Nav links */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.textDim, letterSpacing: "2px", textTransform: "uppercase", padding: "0 10px", marginBottom: 10 }}>Menu</div>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} className={`nav-btn${active ? " active" : ""}`}
                onClick={() => { setPage(n.id); setOpen(false); }}
                style={{
                  width: "100%", background: active ? "rgba(124,58,237,.15)" : "transparent",
                  border: "none", borderRadius: 12, color: active ? C.brand : C.textMid,
                  textAlign: "left", padding: "11px 14px", cursor: "pointer",
                  fontSize: 13.5, fontFamily: "'Inter',sans-serif", fontWeight: active ? 600 : 400,
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
                }}>
                {n.icon}{n.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px 20px", borderTop: `1px solid ${C.border}`, position: "relative" }}>
          <div style={{ background: C.bgRaised, borderRadius: 11, padding: "11px 13px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 2 }}>Powered by Claude AI</div>
            <div style={{ fontSize: 9.5, color: C.textDim }}>© 2026 SkillMatch</div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── DASHBOARD ──────────────────────────────────────────────────────────────── */
function DashboardPage({ history, setPage }) {
  const avg = history.length ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : 0;
  const best = history.length ? Math.max(...history.map(h => h.score)) : 0;

  const stats = [
    { label: "Total Analyses", value: history.length, sub: "sessions run", icon: "📊", brand: true },
    { label: "Resumes Saved", value: history.length, sub: "in your history", icon: "📄", brand: false },
    { label: "Avg Match Score", value: `${avg}%`, sub: "across all roles", icon: "🎯", brand: true },
    { label: "Best Score", value: `${best}%`, sub: "your top result", icon: "🏆", brand: false },
  ];

  return (
    <div style={{ animation: "fadeUp .5s ease both", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.brand, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>Overview</div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 34, fontWeight: 800, color: C.textBright, letterSpacing: "-.5px", lineHeight: 1 }}>Dashboard</h1>
          <p style={{ color: C.textMid, marginTop: 8, fontSize: 13.5 }}>Track your resume performance at a glance</p>
        </div>
        <button className="btn-primary" onClick={() => setPage("analyze")} style={{
          background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
          color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px",
          fontWeight: 600, fontSize: 13.5, fontFamily: "'Inter',sans-serif",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          boxShadow: `0 6px 24px ${C.brandGlow}`,
        }}>
          {Icon.plus} New Analysis
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32, flexShrink: 0 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="card" style={{
            background: s.brand ? `linear-gradient(135deg,${C.brand}22,${C.brandDeep}11)` : C.bgCard,
            border: `1px solid ${s.brand ? C.borderMid : C.border}`,
            borderRadius: 16, padding: "20px 18px",
            boxShadow: s.brand ? `0 4px 20px ${C.brandGlow}` : "none",
            animation: `fadeUp .5s ${i * .08}s ease both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.textDim }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.bgRaised, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1, color: C.textBright }}>{s.value}</div>
            <div style={{ fontSize: 11.5, marginTop: 7, color: C.textMid }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 700, color: C.textBright }}>Recent Analyses</h2>
        <button onClick={() => setPage("history")} style={{ background: "none", border: "none", color: C.brand, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>View all →</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}` }}>
        {history.slice(0, 8).map((h, i) => (
          <div key={h.id} className="row-hover" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 22px", borderBottom: i < Math.min(7, history.length - 1) ? `1px solid ${C.border}` : "none",
            animation: `fadeUp .4s ${i * .06}s ease both`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: scoreBg(h.score), border: `1px solid ${scoreBorder(h.score)}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12, color: scoreColor(h.score),
              }}>{h.score}%</div>
              <div>
                <div style={{ fontWeight: 500, color: C.textBright, fontSize: 14 }}>{h.role}</div>
                <div style={{ color: C.textDim, fontSize: 11.5, marginTop: 2 }}>{h.date}</div>
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: scoreColor(h.score),
              background: scoreBg(h.score), padding: "4px 13px", borderRadius: 20,
              border: `1px solid ${scoreBorder(h.score)}`,
            }}>{scoreLabel(h.score)}</span>
          </div>
        ))}
        {history.length === 0 && (
          <div style={{ padding: "52px", textAlign: "center", color: C.textDim }}>No analyses yet — run your first one!</div>
        )}
      </div>
    </div>
  );
}

/* ── ANALYZE PAGE ───────────────────────────────────────────────────────────── */
function AnalyzePage({ onResult }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [selRole, setSelRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") { alert("Please upload a PDF."); return; }
    setPdfFile(file); setResumeText(""); setExtracting(true);
    try {
      const b64 = await fileToBase64(file);
      const text = await extractTextFromPDF(b64);
      setResumeText(text);
    } catch { alert("Could not read PDF."); }
    setExtracting(false);
  }

  async function handleAnalyze() {
    if (!resumeText.trim()) { alert("Upload a resume PDF first."); return; }
    if (!selRole && !jobDesc.trim()) { alert("Select a role or enter a job description."); return; }
    setLoading(true); setResult(null);
    const jd = jobDesc.trim() || `Standard requirements for ${selRole}`;
    const role = selRole || "the specified role";
    const sys = `You are an expert ATS and career coach. Analyze resumes. Return ONLY valid JSON:\n{"score":<0-100>,"summary":"<2-3 sentences>","strengths":["...","...","..."],"gaps":["...","...","..."],"skills_matched":["...","...","..."],"skills_missing":["...","..."],"recommendations":["...","...","..."]}`;
    try {
      const raw = await callClaude(sys, `Role: ${role}\nJob: ${jd}\n\nResume:\n${resumeText}\n\nJSON only.`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      const full = { ...parsed, role, date };
      setResult(full); onResult(full);
    } catch { alert("Analysis failed. Try again."); }
    setLoading(false);
  }

  const canAnalyze = !!resumeText && !loading && !extracting && (!!selRole || !!jobDesc.trim());

  if (result) return <ResultView result={result} onReset={() => { setResult(null); setPdfFile(null); setResumeText(""); setSelRole(""); setJobDesc(""); }} />;

  return (
    <div style={{ animation: "fadeUp .5s ease both", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.brand, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>New Analysis</div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 34, fontWeight: 800, color: C.textBright, letterSpacing: "-.5px" }}>Analyze Resume</h1>
        <p style={{ color: C.textMid, marginTop: 8, fontSize: 13.5 }}>Upload your PDF and pick a target role — AI does the rest</p>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1, minHeight: 0 }}>

        {/* LEFT — Resume Upload */}
        <div style={{
          background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`,
          padding: 26, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: C.bgRaised, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              {Icon.file}
            </div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.textBright }}>Your Resume</h3>
          </div>

          {!pdfFile ? (
            <div className={`upload-zone${dragOver ? " drag" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById("pdf-inp").click()}
              style={{
                flex: 1, border: `2px dashed ${dragOver ? C.brand : C.borderMid}`,
                borderRadius: 14, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", textAlign: "center", padding: 24,
                background: dragOver ? "rgba(79,110,247,.07)" : C.bgRaised,
              }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `linear-gradient(135deg,${C.brand}22,${C.brandDeep}11)`,
                border: `1px solid ${C.borderMid}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.accent, marginBottom: 16,
              }}>{Icon.upload}</div>
              <p style={{ fontWeight: 600, color: C.textBright, fontSize: 14.5, marginBottom: 6 }}>Drop your PDF here</p>
              <p style={{ color: C.textDim, fontSize: 12.5, marginBottom: 20 }}>or click to browse files</p>
              <span style={{
                background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
                color: "#fff", borderRadius: 10, padding: "10px 26px",
                fontSize: 13, fontWeight: 600, boxShadow: `0 4px 16px ${C.brandGlow}`,
              }}>Choose PDF</span>
              <input id="pdf-inp" type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {/* File pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: C.bgRaised, border: `1px solid ${C.borderMid}`,
                borderRadius: 12, padding: "10px 14px", marginBottom: 14, flexShrink: 0,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", flexShrink: 0,
                }}>{Icon.file}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: C.textBright, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfFile.name}</p>
                  <p style={{ color: C.textDim, fontSize: 11, marginTop: 1 }}>{(pdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => { setPdfFile(null); setResumeText(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
              </div>

              {extracting ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.textMid }}>
                  <div style={{ width: 36, height: 36, border: `3px solid ${C.bgRaised}`, borderTop: `3px solid ${C.brand}`, borderRadius: "50%", animation: "spin .8s linear infinite", marginBottom: 14 }} />
                  <p style={{ fontSize: 13, fontWeight: 500 }}>Extracting text…</p>
                  <p style={{ fontSize: 11.5, color: C.textDim, marginTop: 4 }}>This may take a few seconds</p>
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: ".8px" }}>Extracted Text</label>
                    <span style={{ fontSize: 10, color: C.accent, fontWeight: 600, background: C.bgRaised, padding: "2px 10px", borderRadius: 20, border: `1px solid ${C.borderMid}` }}>
                      {resumeText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} style={{
                    flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 11,
                    padding: "11px 13px", fontSize: 11.5, resize: "none",
                    fontFamily: "monospace", color: C.textMid, background: C.bgRaised,
                    lineHeight: 1.7,
                  }} />
                  <p style={{ fontSize: 10.5, color: C.textDim, marginTop: 6, flexShrink: 0 }}>You may edit the extracted text if needed</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Target Role */}
        <div style={{
          background: C.bgCard, borderRadius: 18, border: `1px solid ${C.border}`,
          padding: 26, display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: C.bgRaised, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              {Icon.target}
            </div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.textBright }}>Target Role</h3>
          </div>

          <label style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: ".8px", display: "block", marginBottom: 8, flexShrink: 0 }}>Job Role</label>
          <select value={selRole} onChange={e => setSelRole(e.target.value)} style={{
            width: "100%", padding: "11px 13px", border: `1.5px solid ${C.border}`,
            borderRadius: 11, fontSize: 13.5, color: selRole ? C.textBright : C.textDim,
            background: C.bgRaised, marginBottom: 20,
            fontFamily: "'Inter',sans-serif", cursor: "pointer", flexShrink: 0,
          }}>
            <option value="">— Select a role —</option>
            {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexShrink: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: ".8px" }}>Job Description</label>
            <span style={{ fontSize: 9.5, color: C.textMid, background: C.bgRaised, padding: "2px 9px", borderRadius: 20, border: `1px solid ${C.border}` }}>optional</span>
          </div>
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
            placeholder="Paste a specific job description for a more precise match analysis…"
            style={{
              flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 11,
              padding: "11px 13px", fontSize: 13, resize: "none",
              fontFamily: "'Inter',sans-serif", color: C.text,
              background: C.bgRaised, lineHeight: 1.7,
            }} />

          {/* Analyze button inside right panel */}
          <button className="btn-primary" onClick={handleAnalyze} disabled={!canAnalyze} style={{
            marginTop: 18, background: canAnalyze ? `linear-gradient(135deg,${C.brand},${C.brandDeep})` : C.bgRaised,
            color: canAnalyze ? "#fff" : C.textDim,
            border: `1px solid ${canAnalyze ? "transparent" : C.border}`,
            borderRadius: 12, padding: "14px 0", fontWeight: 600, fontSize: 15,
            fontFamily: "'Inter',sans-serif", cursor: canAnalyze ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: canAnalyze ? `0 8px 28px ${C.brandGlow}` : "none",
            flexShrink: 0,
          }}>
            {loading
              ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />Analyzing…</>
              : <>{Icon.search} Analyze Resume</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── RESULT VIEW ────────────────────────────────────────────────────────────── */
function ResultView({ result, onReset }) {
  const { score, summary, strengths, gaps, skills_matched, skills_missing, recommendations, role, date } = result;
  const col = scoreColor(score);

  return (
    <div style={{ animation: "scaleIn .4s ease both", height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Hero banner */}
      <div style={{
        background: `linear-gradient(135deg,${C.brand}20,${C.brandDeep}10)`,
        border: `1px solid ${C.borderMid}`, borderRadius: 18,
        padding: "28px 32px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ position: "absolute", right: -50, top: -50, width: 200, height: 200, borderRadius: "50%", background: `${C.brand}06`, pointerEvents: "none" }} />
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: C.textDim, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 8 }}>
            Analysis Result · {date}
          </div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 11, color: C.textBright }}>{role}</h2>
          <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.8, maxWidth: 480 }}>{summary}</p>
        </div>
        <div style={{ textAlign: "center", zIndex: 1, flexShrink: 0, marginLeft: 32 }}>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
            <ScoreRing score={score} size={120} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 9.5, color: C.textDim, marginTop: 2 }}>/ 100</span>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: col, background: scoreBg(score), padding: "5px 16px", borderRadius: 20, border: `1px solid ${scoreBorder(score)}` }}>
            {scoreLabel(score)}
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, flexShrink: 0 }}>
        <BulletCard title="Strengths" dotColor={C.green} borderAccent={C.green} items={strengths} />
        <BulletCard title="Gaps to Address" dotColor={C.red} borderAccent={C.red} items={gaps} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, flexShrink: 0 }}>
        <ChipCard title="Skills Matched" skills={skills_matched} color={C.green} bg={C.greenPale} border={C.greenBorder} />
        <ChipCard title="Skills Missing" skills={skills_missing} color={C.red} bg={C.redPale} border={C.redBorder} />
      </div>

      {/* Recommendations */}
      <div style={{
        background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`,
        padding: "22px 24px", marginBottom: 22, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, background: C.bgRaised, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
            {Icon.bulb}
          </div>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: C.textBright }}>Recommendations</h3>
        </div>
        {recommendations?.map((r, i) => (
          <div key={i} style={{
            display: "flex", gap: 13, padding: "11px 0",
            borderBottom: i < recommendations.length - 1 ? `1px solid ${C.border}` : "none",
            alignItems: "flex-start",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1,
            }}>{i + 1}</div>
            <p style={{ margin: 0, color: C.textMid, fontSize: 13.5, lineHeight: 1.78 }}>{r}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <button className="btn-ghost" onClick={onReset} style={{
          background: "transparent", color: C.textMid,
          border: `1.5px solid ${C.border}`, borderRadius: 11,
          padding: "12px 32px", fontWeight: 500, fontSize: 13.5,
          fontFamily: "'Inter',sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ← Analyze Another Resume
        </button>
      </div>
    </div>
  );
}

function BulletCard({ title, dotColor, borderAccent, items }) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px", borderLeft: `3px solid ${borderAccent}` }}>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: C.textBright, marginBottom: 14 }}>{title}</h3>
      {items?.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0, marginTop: 6 }} />
          <p style={{ margin: 0, color: C.textMid, fontSize: 13, lineHeight: 1.7 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function ChipCard({ title, skills, color, bg, border }) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 22px" }}>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: C.textBright, marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {skills?.map((s, i) => (
          <span key={i} className="skill-chip" style={{ background: bg, color, borderRadius: 20, padding: "4px 13px", fontSize: 12, fontWeight: 500, border: `1px solid ${border}` }}>{s}</span>
        ))}
        {(!skills || skills.length === 0) && <span style={{ color: C.textDim, fontSize: 12.5 }}>None identified</span>}
      </div>
    </div>
  );
}

/* ── HISTORY PAGE ───────────────────────────────────────────────────────────── */
/* ── HISTORY DETAIL PANEL ───────────────────────────────────────────────────── */
function HistoryDetail({ entry, onBack }) {
  const { score, summary, strengths, gaps, skills_matched, skills_missing, recommendations, role, date } = entry;
  const col = scoreColor(score);
  return (
    <div style={{ animation: "scaleIn .35s ease both", height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Back button */}
      <button className="btn-ghost" onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 20,
        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "8px 16px", fontSize: 13, fontWeight: 500, color: C.textMid,
        cursor: "pointer", fontFamily: "'Inter',sans-serif", alignSelf: "flex-start", flexShrink: 0,
      }}>← Back to History</button>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg,${C.brand}12,${C.accent}08)`,
        border: `1px solid ${C.borderMid}`, borderRadius: 18,
        padding: "26px 30px", marginBottom: 18,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: `${C.brand}07`, pointerEvents: "none" }} />
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: C.textDim, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 8 }}>Analysis · {date}</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 10, color: C.textBright }}>{role}</h2>
          {summary && <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.8, maxWidth: 480 }}>{summary}</p>}
        </div>
        <div style={{ textAlign: "center", zIndex: 1, flexShrink: 0, marginLeft: 28 }}>
          <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
            <ScoreRing score={score} size={110} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 9.5, color: C.textDim, marginTop: 2 }}>/ 100</span>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: col, background: scoreBg(score), padding: "4px 14px", borderRadius: 20, border: `1px solid ${scoreBorder(score)}` }}>
            {scoreLabel(score)}
          </div>
        </div>
      </div>

      {/* No detail data fallback */}
      {!summary && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px", textAlign: "center", marginBottom: 16, flexShrink: 0 }}>
          <p style={{ color: C.textDim, fontSize: 13.5 }}>📋 This analysis was saved before full detail storage was enabled.</p>
          <p style={{ color: C.textDim, fontSize: 12.5, marginTop: 6 }}>Run a new analysis to see complete breakdown.</p>
        </div>
      )}

      {summary && (<>
        {/* Strengths + Gaps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, flexShrink: 0 }}>
          <BulletCard title="✅ Strengths" dotColor={C.green} borderAccent={C.green} items={strengths} />
          <BulletCard title="⚠️ Gaps to Address" dotColor={C.red} borderAccent={C.red} items={gaps} />
        </div>
        {/* Skills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, flexShrink: 0 }}>
          <ChipCard title="Skills Matched" skills={skills_matched} color={C.green} bg={C.greenPale} border={C.greenBorder} />
          <ChipCard title="Skills Missing" skills={skills_missing} color={C.red} bg={C.redPale} border={C.redBorder} />
        </div>
        {/* Recommendations */}
        <div style={{ background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 22px", marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, background: C.bgRaised, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>{Icon.bulb}</div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: C.textBright }}>Recommendations</h3>
          </div>
          {recommendations?.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < recommendations.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg,${C.brand},${C.brandDeep})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <p style={{ margin: 0, color: C.textMid, fontSize: 13.5, lineHeight: 1.75 }}>{r}</p>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

/* ── HISTORY PAGE ───────────────────────────────────────────────────────────── */
function HistoryPage({ history, onClear }) {
  const [selected, setSelected] = useState(null);

  // If user clicked an entry, show its full detail
  if (selected) return <HistoryDetail entry={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ animation: "fadeUp .5s ease both", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 22, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.brand, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>Records</div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 34, fontWeight: 800, color: C.textBright, letterSpacing: "-.5px" }}>History</h1>
          <p style={{ color: C.textMid, marginTop: 8, fontSize: 13.5 }}>Click any row to see the full analysis breakdown</p>
        </div>
        {history.length > 0 && (
          <button onClick={onClear}
            onMouseOver={e => e.currentTarget.style.background = C.redPale}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
            style={{
              background: "transparent", border: `1px solid ${C.redBorder}`,
              color: C.red, borderRadius: 10, padding: "9px 18px",
              fontSize: 12.5, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", transition: "all .2s ease",
            }}>
            🗑 Clear All
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, minHeight: 0 }}>
        {/* Header row */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.3fr 0.8fr 1.2fr 0.5fr",
          padding: "12px 22px", background: C.bgRaised,
          borderBottom: `1px solid ${C.border}`,
          fontSize: 9.5, fontWeight: 600, color: C.textDim,
          textTransform: "uppercase", letterSpacing: "1.3px",
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <span>Job Role</span><span>Date</span><span>Score</span><span>Status</span><span></span>
        </div>

        {history.map((h, i) => (
          <div key={h.id} className="row-hover"
            onClick={() => setSelected(h)}
            style={{
              display: "grid", gridTemplateColumns: "2fr 1.3fr 0.8fr 1.2fr 0.5fr",
              padding: "14px 22px", alignItems: "center",
              borderBottom: i < history.length - 1 ? `1px solid ${C.border}` : "none",
              animation: `fadeUp .4s ${i * .05}s ease both`,
              cursor: "pointer",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: scoreColor(h.score), flexShrink: 0, boxShadow: `0 0 6px ${scoreColor(h.score)}88` }} />
              <span style={{ fontWeight: 500, color: C.textBright, fontSize: 13.5 }}>{h.role}</span>
            </div>
            <span style={{ color: C.textMid, fontSize: 12.5 }}>{h.date}</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: scoreColor(h.score),
              background: scoreBg(h.score), padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${scoreBorder(h.score)}`, display: "inline-block",
            }}>{h.score}%</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: scoreColor(h.score),
              background: scoreBg(h.score), padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${scoreBorder(h.score)}`, display: "inline-block",
            }}>{scoreLabel(h.score)}</span>
            <span style={{ color: C.accent, fontSize: 16, textAlign: "right" }}>›</span>
          </div>
        ))}

        {history.length === 0 && (
          <div style={{ padding: "60px 32px", textAlign: "center", color: C.textDim }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>
            <p style={{ fontWeight: 500, fontSize: 14, color: C.textMid }}>No analyses yet</p>
            <p style={{ fontSize: 12.5, marginTop: 6 }}>Run your first resume analysis to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── APP ROOT ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);   // starts empty — loaded from storage
  const [nextId, setNextId] = useState(1);
  const [loaded, setLoaded] = useState(false); // stops flash of empty state
  const [sidebarOpen, setSidebarOpen] = useState(false); // sidebar collapsed by default

  // ── Load saved history from persistent storage on first mount ──
  useEffect(() => {
    async function loadHistory() {
      try {
        const result = await window.storage.get("skillmatch:history");
        if (result && result.value) {
          const saved = JSON.parse(result.value);
          setHistory(saved);
          // next ID = highest existing id + 1
          const maxId = saved.reduce((m, h) => Math.max(m, h.id), 0);
          setNextId(maxId + 1);
        }
      } catch {
        // no saved data yet — start fresh, that's fine
      }
      setLoaded(true);
    }
    loadHistory();
  }, []);

  // ── Save history to persistent storage whenever it changes ──
  useEffect(() => {
    if (!loaded) return; // don't save the initial empty state
    async function saveHistory() {
      try {
        await window.storage.set("skillmatch:history", JSON.stringify(history));
      } catch {
        console.error("Could not save history");
      }
    }
    saveHistory();
  }, [history, loaded]);

  // ── Called when a new analysis finishes — save FULL result data ──
  function handleResult(r) {
    const newEntry = {
      id: nextId,
      role: r.role,
      date: r.date,
      score: r.score,
      summary: r.summary,
      strengths: r.strengths,
      gaps: r.gaps,
      skills_matched: r.skills_matched,
      skills_missing: r.skills_missing,
      recommendations: r.recommendations,
    };
    setHistory(prev => [newEntry, ...prev]);
    setNextId(n => n + 1);
  }

  // ── Clear all history ──
  async function handleClearHistory() {
    if (!window.confirm("Delete all history? This cannot be undone.")) return;
    setHistory([]);
    setNextId(1);
    try { await window.storage.delete("skillmatch:history"); } catch { }
  }

  // ── Loading screen while we read from storage ──
  if (!loaded) {
    return (
      <>
        <StyleTag />
        <div style={{
          display: "flex", width: "100vw", height: "100vh",
          background: C.bg, alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, border: `3px solid ${C.bgRaised}`,
            borderTop: `3px solid ${C.brand}`, borderRadius: "50%",
            animation: "spin .8s linear infinite",
          }} />
          <p style={{ color: C.textDim, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>Loading your history…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <StyleTag />
      <div style={{
        display: "flex", width: "100vw", height: "100vh",
        background: C.bg, fontFamily: "'Inter',sans-serif", overflow: "hidden",
      }}>
        <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
        <main style={{
          flex: 1, padding: "36px 44px", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {page === "dashboard" && <DashboardPage history={history} setPage={setPage} />}
          {page === "analyze" && <AnalyzePage onResult={handleResult} />}
          {page === "history" && <HistoryPage history={history} onClear={handleClearHistory} setPage={setPage} />}
        </main>
      </div>
    </>
  );
}
