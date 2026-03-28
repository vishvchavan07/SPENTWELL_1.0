import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORIES = [
  { id: "food",          label: "Food",      icon: "🍕", color: "#FF6B6B" },
  { id: "transport",     label: "Transport", icon: "🚗", color: "#4F9EFF" },
  { id: "study",         label: "Study",     icon: "📚", color: "#A78BFA" },
  { id: "entertainment", label: "Fun",       icon: "🎮", color: "#00D9A6" },
  { id: "health",        label: "Health",    icon: "💊", color: "#FF8C42" },
  { id: "shopping",      label: "Shopping",  icon: "🛍️", color: "#FFB800" },
  { id: "other",         label: "Other",     icon: "💸", color: "#64748B" },
];

const DAILY_DATA = [
  { day: "Mon", amount: 0 }, { day: "Tue", amount: 0 }, { day: "Wed", amount: 0 },
  { day: "Thu", amount: 0 }, { day: "Fri", amount: 0 }, { day: "Sat", amount: 0 }, { day: "Sun", amount: 0 },
];

const CHALLENGES = [
  { id: 1, title: "No Junk Food", desc: "3 din junk food se door raho", progress: 0, total: 3, reward: "🏅 Healthy Hawk", done: false },
  { id: 2, title: "Transport Saver", desc: "Transport ₹100 se kam rakho this week", progress: 0, total: 5, reward: "⚡ Speed Saver", done: false },
  { id: 3, title: "Budget Master", desc: "7 din budget ke andar raho", progress: 0, total: 7, reward: "👑 Budget King", done: false },
];

const BADGES = [
  { id: 1, title: "First Step", icon: "🎯", earned: false },
  { id: 2, title: "7-Day Streak", icon: "🔥", earned: false },
  { id: 3, title: "Budget King", icon: "👑", earned: false },
  { id: 4, title: "Saver Pro",   icon: "💎", earned: false },
  { id: 5, title: "No Spend Day",icon: "🧘", earned: false },
  { id: 6, title: "Desi Saver",  icon: "🇮🇳", earned: false },
];

const DEFAULT_KEEPER = {
  food:          { locked: false, limit: 500,  alert: 400, parentApproval: false },
  transport:     { locked: false, limit: 300,  alert: 200, parentApproval: false },
  entertainment: { locked: true,  limit: 200,  alert: 150, parentApproval: true  },
  shopping:      { locked: true,  limit: 300,  alert: 200, parentApproval: true  },
  study:         { locked: false, limit: 1000, alert: 800, parentApproval: false },
  health:        { locked: false, limit: 500,  alert: 400, parentApproval: false },
  other:         { locked: false, limit: 200,  alert: 150, parentApproval: false },
};

// ── Helpers ─────────────────────────────────────────────────
const genCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

const cleanPhone = (p = "") => {
  const d = p.toString().replace(/\D/g, "");
  if (d.startsWith("91") && d.length === 12) return d;
  if (d.length === 10) return "91" + d;
  return d;
};

const today = new Date().toISOString().slice(0, 10);

// ── Main Component ──────────────────────────────────────────
export default function SpentWell({ user = {}, onLogout }) {
  const userId      = user.userId    || user.phone || "guest";
  const userName    = user.name      || "Student";
  const userCollege = user.college   || "Your College";
  const userYear    = user.year      || "";
  const parentPhone = user.parentPhone || "";
  const userPhone   = user.phone     || "";
  const userBudget  = parseInt(user.monthlyBudget) || 5000;

  // ── State ────────────────────────────────────────────────
  const [screen, setScreen]           = useState("home");
  const [dark, setDark]               = useState(true);
  const [expenses, setExpenses]       = useState([]);
  const [ious, setIous]               = useState([]);
  const [expView, setExpView]         = useState("list");
  const [showAdd, setShowAdd]         = useState(false);
  const [showIOU, setShowIOU]         = useState(false);
  const [aiTip, setAiTip]             = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [listening, setListening]     = useState(false);
  const [whatsappOn, setWhatsappOn]   = useState(true);
  const [keeper, setKeeper]           = useState(DEFAULT_KEEPER);
  const [keeperMasterOn, setKeeperMasterOn] = useState(true);
  const [editingCat, setEditingCat]   = useState(null);
  const [showKeeperModal, setShowKeeperModal] = useState(false);
  const [keeperEdit, setKeeperEdit]   = useState({});
  const [form, setForm]               = useState({ amount: "", category: "food", note: "", type: "expense" });
  const [iouForm, setIouForm]         = useState({ name: "", amount: "", type: "given", due: "", note: "" });
  const [dataLoaded, setDataLoaded]   = useState(false);

  // Approval flow state
  const [pendingApproval, setPendingApproval] = useState(null); // { code, category, amount, note }
  const [showApprovalWait, setShowApprovalWait] = useState(false);
  const [approvalInput, setApprovalInput]   = useState("");
  const [approvalError, setApprovalError]   = useState("");
  const [approvalGranted, setApprovalGranted] = useState(false);

  // ── 1. LOAD from localStorage on mount ──────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`sw_data_${userId}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.expenses)       setExpenses(saved.expenses);
        if (saved.ious)           setIous(saved.ious);
        if (saved.keeper)         setKeeper(saved.keeper);
        if (saved.keeperMasterOn !== undefined) setKeeperMasterOn(saved.keeperMasterOn);
        if (saved.whatsappOn     !== undefined) setWhatsappOn(saved.whatsappOn);
      }
    } catch (e) { console.error("Load error:", e); }
    setDataLoaded(true);
    fetchAI();
  }, [userId]);

  // ── 2. SAVE to localStorage on every data change ────────
  useEffect(() => {
    if (!dataLoaded) return;
    try {
      localStorage.setItem(`sw_data_${userId}`, JSON.stringify({
        expenses, ious, keeper, keeperMasterOn, whatsappOn,
      }));
    } catch (e) { console.error("Save error:", e); }
  }, [expenses, ious, keeper, keeperMasterOn, whatsappOn, dataLoaded]);

  // ── Derived values ───────────────────────────────────────
  const streak      = expenses.length > 0 ? Math.min(expenses.length, 30) : 0;
  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0);
  const todaySpent  = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const budgetPct   = Math.min((totalSpent / userBudget) * 100, 100);
  const lockedCount = Object.values(keeper).filter(k => k.locked).length;

  const catTotals = CATEGORIES.map(c => ({
    name: c.label,
    value: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    color: c.color,
  })).filter(c => c.value > 0);

  const iouBalance = ious.filter(i => i.type === "given").reduce((s, i) => s + i.amount, 0)
    - ious.filter(i => i.type === "borrowed").reduce((s, i) => s + i.amount, 0);

  const getGrade = () => {
    const p = totalSpent / userBudget;
    if (p === 0)   return { g: "—",  c: "#64748B", msg: "Abhi koi kharch nahi — fresh start! 🌟" };
    if (p < 0.6)   return { g: "A+", c: "#00D9A6", msg: "Arre wah bhai! Ekdum solid saving! 🏆" };
    if (p < 0.75)  return { g: "A",  c: "#4F9EFF", msg: "Bahut acha! Thoda aur tight karo!" };
    if (p < 0.9)   return { g: "B",  c: "#FFB800", msg: "Theek hai yaar, extras pe dhyan rakh" };
    if (p < 1.0)   return { g: "C",  c: "#FF8C42", msg: "Bhai, budget khatam hone wala hai! 😬" };
    return { g: "D", c: "#FF6B6B", msg: "Oops! Budget tod diya is mahine 😅" };
  };

  // ── AI Tip ───────────────────────────────────────────────
  const fetchAI = async () => {
    setAiLoading(true);
    try {
      const summary = catTotals.length > 0 ? catTotals.map(c => `${c.name}: ₹${c.value}`).join(", ") : "No expenses yet";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [{ role: "user", content: `You are a fun desi Indian financial buddy for college students. Reply in Hinglish — mix Hindi words like yaar, bhai, arre, bindaas, seedha, etc. Use emojis. My spending: ${summary}. Total ₹${totalSpent} of ₹${userBudget} budget. Give ONE practical tip in 2-3 sentences. Be funny and specific.` }],
        }),
      });
      const d = await r.json();
      setAiTip(d.content?.[0]?.text || "");
    } catch {
      setAiTip("Arre yaar, roz kharch track karo — ek hafte mein hi pata chalega paisa kahan ja raha hai! 💰 Seedha baat: UPI history check karo, sach saamne aa jayega! 😄");
    }
    setAiLoading(false);
  };

  // ── 3. PARENT APPROVAL SYSTEM ────────────────────────────
  const requestParentApproval = () => {
    const code = genCode();
    const requestData = {
      code,
      studentName: userName,
      studentPhone: userPhone,
      category: form.category,
      amount: parseFloat(form.amount),
      note: form.note || "No description",
    };

    // Store pending request in localStorage
    localStorage.setItem(`sw_pending_${userId}`, JSON.stringify({ ...requestData, timestamp: Date.now() }));
    setPendingApproval(requestData);

    // Build parent approval URL (they open this link)
    const encoded  = btoa(JSON.stringify(requestData));
    const reviewUrl = `${window.location.origin}${window.location.pathname}?sw_review=${encoded}`;

    const cat = CATEGORIES.find(c => c.id === form.category);
    const msg =
`🛡️ *SpentWell Keeper Alert*

Aapka ward *${userName}* ₹${form.amount} *${cat?.label || form.category}* pe spend karna chahta/chahti hai.

📋 *Details:*
• Category: ${cat?.label || form.category} ${cat?.icon || ""}
• Amount: ₹${form.amount}
• Note: ${form.note || "—"}

👆 *Allow ya Deny karne ke liye neeche click karein:*
${reviewUrl}

_(Agar aap Allow karenge toh ek approval code milega jo student ko dena hoga)_`;

    // Open WhatsApp with parent's number
    window.open(`https://wa.me/${cleanPhone(parentPhone)}?text=${encodeURIComponent(msg)}`, "_blank");

    // Show waiting modal
    setShowAdd(false);
    setApprovalInput("");
    setApprovalError("");
    setShowApprovalWait(true);
  };

  const verifyApprovalCode = () => {
    const stored = JSON.parse(localStorage.getItem(`sw_pending_${userId}`) || "null");
    if (!stored) { setApprovalError("Koi pending request nahi mili. Dobara try karo."); return; }

    const entered = approvalInput.trim().toUpperCase();
    if (entered !== stored.code) {
      setApprovalError("❌ Wrong code yaar! Parent ne jo code bheja, wahi daalo.");
      return;
    }

    // ✅ Code matched — add the expense
    setExpenses(p => [{
      id: Date.now(),
      category: stored.category,
      amount: stored.amount,
      note: stored.note,
      date: today,
      type: "expense",
      approvedByParent: true,
    }, ...p]);

    localStorage.removeItem(`sw_pending_${userId}`);
    setPendingApproval(null);
    setForm({ amount: "", category: "food", note: "", type: "expense" });
    setApprovalGranted(true);
    setTimeout(() => { setShowApprovalWait(false); setApprovalGranted(false); }, 2200);
  };

  // ── addExpense — checks keeper before adding ─────────────
  const addExpense = () => {
    if (!form.amount) return;
    const k = keeper[form.category];
    const needsApproval = k?.locked && k?.parentApproval && keeperMasterOn;

    if (needsApproval) {
      if (!parentPhone) {
        alert("Parent ka number set nahi hai! Keeper settings mein add karo.");
        return;
      }
      requestParentApproval();
      return;
    }

    // No approval needed — add directly
    setExpenses(p => [{
      id: Date.now(),
      category: form.category,
      amount: parseFloat(form.amount),
      note: form.note || "No description",
      date: today,
      type: form.type,
    }, ...p]);
    setForm({ amount: "", category: "food", note: "", type: "expense" });
    setShowAdd(false);
  };

  const addIOU = () => {
    if (!iouForm.name || !iouForm.amount) return;
    setIous(p => [{ id: Date.now(), ...iouForm, amount: parseFloat(iouForm.amount) }, ...p]);
    setIouForm({ name: "", amount: "", type: "given", due: "", note: "" });
    setShowIOU(false);
  };

  const openKeeperEdit = (catId) => { setEditingCat(catId); setKeeperEdit({ ...keeper[catId] }); setShowKeeperModal(true); };
  const saveKeeperEdit = () => { setKeeper(k => ({ ...k, [editingCat]: { ...keeperEdit } })); setShowKeeperModal(false); };

  // ── Theme ────────────────────────────────────────────────
  const T = {
    bg: dark ? "#070B14" : "#EEF2FF",
    surface: dark ? "#0D1220" : "#FFFFFF",
    card: dark ? "#111827" : "#FAFBFF",
    border: dark ? "rgba(79,158,255,0.12)" : "rgba(79,158,255,0.2)",
    text: dark ? "#F0F4FF" : "#0D1220",
    sub: dark ? "#CBD5E1" : "#475569",
    muted: dark ? "#64748B" : "#94A3B8",
    navBg: dark ? "rgba(7,11,20,0.95)" : "rgba(255,255,255,0.95)",
  };

  // ── CSS ──────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    ::-webkit-scrollbar{width:0;}
    input[type=number]::-webkit-inner-spin-button{display:none;}

    @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(28px,-18px) scale(1.06)}66%{transform:translate(-18px,14px) scale(0.94)}}
    @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-22px,18px) scale(1.08)}66%{transform:translate(18px,-12px) scale(0.92)}}
    @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(16px,22px) scale(1.04)}}
    @keyframes float4{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,-26px)}}
    @keyframes float5{0%,100%{transform:translate(0,0)}50%{transform:translate(24px,14px)}}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(79,158,255,0.5)}70%{box-shadow:0 0 0 10px rgba(79,158,255,0)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.45)}60%{box-shadow:0 0 0 10px rgba(255,107,107,0)}}
    @keyframes lockPop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    @keyframes checkPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}

    .sw-app{background:${T.bg};color:${T.text};min-height:100vh;max-width:430px;margin:0 auto;font-family:'Plus Jakarta Sans',sans-serif;position:relative;overflow:hidden;}
    .outfit{font-family:'Outfit',sans-serif;}
    .fade-in{animation:fadeIn 0.35s ease forwards;}
    .scroll-area{overflow-y:auto;height:100vh;padding-bottom:90px;}
    .card{background:${T.card};border:1px solid ${T.border};border-radius:20px;padding:16px;}
    .card-hover{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
    .card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(79,158,255,0.12);}
    .bubble{cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;border-radius:50%;position:absolute;transition:transform 0.15s;user-select:none;}
    .bubble:hover{transform:scale(1.12) !important;}
    .bubble:active{transform:scale(0.92) !important;}
    .fab{position:fixed;bottom:82px;right:calc(50% - 195px);width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#4F9EFF,#00D9A6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(79,158,255,0.5);z-index:100;animation:pulse 2.5s infinite;transition:transform 0.2s;}
    .fab:hover{transform:scale(1.1);}
    .fab:active{transform:scale(0.93);}
    .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:${T.navBg};backdrop-filter:blur(24px);border-top:1px solid ${T.border};display:flex;justify-content:space-around;padding:10px 0 18px;z-index:99;}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 14px;transition:all 0.2s;}
    .nav-label{font-size:10px;font-weight:600;color:${T.muted};transition:color 0.2s;}
    .nav-item.active .nav-label{color:#4F9EFF;}
    .nav-pip{width:4px;height:4px;border-radius:50%;background:transparent;transition:all 0.2s;margin-top:1px;}
    .nav-item.active .nav-pip{background:#4F9EFF;}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .modal{background:${T.surface};border-radius:28px 28px 0 0;padding:24px 20px;width:100%;max-width:430px;animation:slideUp 0.32s cubic-bezier(0.34,1.56,0.64,1);max-height:92vh;overflow-y:auto;}
    .input-f{background:${dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"};border:1px solid ${T.border};border-radius:14px;padding:13px 15px;color:${T.text};font-size:15px;font-family:'Plus Jakarta Sans',sans-serif;width:100%;outline:none;transition:border-color 0.2s;}
    .input-f:focus{border-color:#4F9EFF;}
    .input-f::placeholder{color:${T.muted};}
    .btn-main{background:linear-gradient(135deg,#4F9EFF,#00D9A6);border:none;border-radius:16px;padding:15px;color:#fff;font-size:16px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;width:100%;transition:all 0.2s;}
    .btn-main:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(79,158,255,0.45);}
    .toggle-group{display:flex;background:${dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"};border-radius:14px;padding:4px;border:1px solid ${T.border};}
    .toggle-btn{flex:1;padding:8px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;background:transparent;color:${T.muted};}
    .toggle-btn.active{color:#fff;}
    .cat-chip{padding:7px 14px;border-radius:20px;border:1px solid;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
    .badge-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-radius:18px;text-align:center;}
    .badge-on{background:linear-gradient(135deg,rgba(79,158,255,0.14),rgba(0,217,166,0.12));border:1px solid rgba(79,158,255,0.3);}
    .badge-off{background:${dark?"rgba(100,116,139,0.08)":"rgba(0,0,0,0.04)"};border:1px solid ${T.border};opacity:0.55;}
    .sw-toggle{width:46px;height:26px;border-radius:13px;position:relative;cursor:pointer;border:none;transition:background 0.3s;flex-shrink:0;}
    .sw-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left 0.3s;}
    .skeleton{background:linear-gradient(90deg,${dark?"#1a2233":"#e8eaf6"} 25%,${dark?"#243050":"#dde1f5"} 50%,${dark?"#1a2233":"#e8eaf6"} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
    .chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;}
    .up{color:#00D9A6;background:rgba(0,217,166,0.12);}
    .down{color:#FF6B6B;background:rgba(255,107,107,0.12);}
    .keeper-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;cursor:pointer;transition:all 0.18s;margin-bottom:6px;}
    .keeper-row:hover{background:${dark?"rgba(79,158,255,0.05)":"rgba(79,158,255,0.04)"};}
    .prog-bg{height:5px;border-radius:3px;background:${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"};overflow:hidden;margin-top:5px;}
    .range-input{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"};outline:none;}
    .range-input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4F9EFF,#00D9A6);cursor:pointer;box-shadow:0 2px 8px rgba(79,158,255,0.4);}
    .code-input{background:rgba(79,158,255,0.08);border:2px solid rgba(79,158,255,0.3);border-radius:16px;padding:16px;color:#F0F4FF;font-size:26px;font-weight:900;font-family:'Outfit',sans-serif;width:100%;outline:none;text-align:center;letter-spacing:6px;transition:all 0.2s;}
    .code-input:focus{border-color:#4F9EFF;box-shadow:0 0 0 3px rgba(79,158,255,0.15);}
    .wa-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;border-radius:16px;padding:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all 0.22s;font-family:'Outfit',sans-serif;}
    .wa-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,0.45);}
  `;

  // ── HOME ─────────────────────────────────────────────────
  const HomeScreen = () => (
    <div className="fade-in scroll-area">
      <div style={{padding:"52px 18px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{color:T.muted,fontSize:13,marginBottom:3}}>Good Morning 👋</div>
            <div className="outfit" style={{fontSize:26,fontWeight:800,lineHeight:1.1}}>{userName}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setDark(!dark)} style={{background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",border:`1px solid ${T.border}`,borderRadius:12,padding:"9px 10px",cursor:"pointer",fontSize:16}}>{dark?"☀️":"🌙"}</button>
            <div style={{position:"relative"}}>
              <div style={{background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",border:`1px solid ${T.border}`,borderRadius:12,padding:"9px 10px",cursor:"pointer",fontSize:16}}>🔔</div>
              <div style={{position:"absolute",top:-2,right:-2,width:9,height:9,borderRadius:"50%",background:"#FF6B6B",border:"2px solid "+T.bg}}/>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{background:"linear-gradient(135deg,#0f1f40 0%,#0a1629 60%,#061020 100%)",borderRadius:26,padding:22,border:"1px solid rgba(79,158,255,0.22)",marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(79,158,255,0.07)"}}/>
          <div style={{position:"absolute",bottom:-30,left:40,width:100,height:100,borderRadius:"50%",background:"rgba(0,217,166,0.05)"}}/>
          <div style={{position:"relative"}}>
            <div style={{color:"rgba(240,244,255,0.55)",fontSize:12,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Is Mahine Kharch</div>
            <div className="outfit" style={{fontSize:46,fontWeight:900,color:"#F0F4FF",lineHeight:1,marginBottom:2}}>₹{totalSpent.toLocaleString()}</div>
            <div style={{color:"rgba(240,244,255,0.45)",fontSize:13,marginBottom:16}}>of ₹{userBudget.toLocaleString()} monthly budget</div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,height:7,marginBottom:7,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${budgetPct}%`,borderRadius:8,background:budgetPct>85?"linear-gradient(90deg,#FF8C42,#FF6B6B)":"linear-gradient(90deg,#4F9EFF,#00D9A6)",transition:"width 1.2s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(240,244,255,0.45)"}}>
              <span>{Math.round(budgetPct)}% use ho gaya</span>
              <span>₹{Math.max(0, userBudget-totalSpent).toLocaleString()} bacha hai</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{e:"🔥",v:`${streak} days`,l:"Streak",c:"#FF8C42"},{e:"📅",v:`₹${todaySpent}`,l:"Aaj",c:"#4F9EFF"},{e:"🤝",v:`${iouBalance>=0?"+":""}₹${iouBalance}`,l:"IOU Net",c:iouBalance>=0?"#00D9A6":"#FF6B6B"}].map((s,i)=>(
            <div key={i} className="card" style={{textAlign:"center",padding:"12px 8px"}}>
              <div style={{fontSize:22,marginBottom:5}}>{s.e}</div>
              <div className="outfit" style={{fontSize:14,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:3,fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Keeper Banner */}
        <div onClick={()=>setScreen("keeper")} style={{background:keeperMasterOn?"linear-gradient(135deg,rgba(255,107,107,0.1),rgba(255,140,66,0.07))":dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",border:`1px solid ${keeperMasterOn?"rgba(255,107,107,0.3)":T.border}`,borderRadius:20,padding:"13px 16px",marginBottom:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:14,background:keeperMasterOn?"rgba(255,107,107,0.16)":dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🛡️</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:T.text}}>Keeper {keeperMasterOn?<span style={{color:"#00D9A6",fontSize:11}}>● ON</span>:<span style={{color:T.muted,fontSize:11}}>● OFF</span>}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{lockedCount} categories locked • WhatsApp approval system active</div>
          </div>
          <div style={{color:T.muted,fontSize:20,fontWeight:300}}>›</div>
        </div>

        {/* Quick Add */}
        <div className="card" style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div className="outfit" style={{fontWeight:700,fontSize:15}}>Quick Add</div>
            <div style={{fontSize:11,color:"#4F9EFF",fontWeight:600}}>Tap karo →</div>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:2}}>
            {CATEGORIES.map(cat=>(
              <div key={cat.id} onClick={()=>{setForm(f=>({...f,category:cat.id}));setShowAdd(true);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,minWidth:52,cursor:"pointer",position:"relative"}}>
                <div style={{width:48,height:48,borderRadius:16,background:`${cat.color}18`,border:`1.5px solid ${cat.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{cat.icon}</div>
                {keeper[cat.id]?.locked&&keeperMasterOn&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#FF6B6B",border:"2px solid "+T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>🔒</div>}
                <span style={{fontSize:10,color:T.muted,fontWeight:600}}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tip */}
        <div style={{background:"linear-gradient(135deg,rgba(79,158,255,0.09),rgba(0,217,166,0.09))",border:"1px solid rgba(79,158,255,0.22)",borderRadius:20,padding:16,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:18}}>✨</span>
            <span className="outfit" style={{fontWeight:700,fontSize:13,color:"#4F9EFF"}}>Desi AI Tip</span>
            <button onClick={fetchAI} style={{marginLeft:"auto",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:0}}>↻</button>
          </div>
          <div style={{fontSize:13.5,color:T.sub,lineHeight:1.65}}>
            {aiLoading?<><div className="skeleton" style={{height:14,marginBottom:6}}/><div className="skeleton" style={{height:14,width:"70%"}}/></>:aiTip||"↻ dabao ek desi tip lene ke liye!"}
          </div>
        </div>

        {/* Recent */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div className="outfit" style={{fontWeight:700,fontSize:15}}>Recent Expenses</div>
            <div onClick={()=>setScreen("expenses")} style={{fontSize:11,color:"#4F9EFF",fontWeight:600,cursor:"pointer"}}>Sab dekho →</div>
          </div>
          {expenses.length===0?(
            <div style={{textAlign:"center",padding:"24px",background:T.card,border:`1px solid ${T.border}`,borderRadius:20}}>
              <div style={{fontSize:36,marginBottom:10}}>🧾</div>
              <div style={{fontSize:13,color:T.muted,fontWeight:600}}>Koi kharch nahi abhi tak</div>
              <div style={{fontSize:12,color:T.muted,marginTop:4}}>+ button se add karo!</div>
            </div>
          ):expenses.slice(0,4).map(exp=>{
            const cat=CATEGORIES.find(c=>c.id===exp.category);
            return(
              <div key={exp.id} className="card card-hover" style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${cat.color}18`,border:`1px solid ${cat.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{exp.note}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>
                    {cat.label} • {exp.date}
                    {exp.approvedByParent&&<span style={{color:"#00D9A6",marginLeft:6,fontSize:10}}>✓ Parent Approved</span>}
                  </div>
                </div>
                <div className="outfit" style={{fontWeight:800,color:"#FF6B6B",fontSize:15,flexShrink:0}}>−₹{exp.amount}</div>
              </div>
            );
          })}
        </div>

        {/* IOU */}
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div className="outfit" style={{fontWeight:700,fontSize:15}}>Money Tracker 🤝</div>
            <button onClick={()=>setShowIOU(true)} style={{background:"rgba(79,158,255,0.1)",border:"1px solid rgba(79,158,255,0.3)",borderRadius:10,padding:"5px 12px",color:"#4F9EFF",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
          </div>
          {ious.length===0?(
            <div style={{textAlign:"center",padding:"16px 0",color:T.muted,fontSize:13}}>
              Koi IOU nahi abhi • + Add se track karo
            </div>
          ):ious.map((iou,i)=>(
            <div key={iou.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<ious.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{width:38,height:38,borderRadius:12,background:iou.type==="given"?"rgba(0,217,166,0.14)":"rgba(255,107,107,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{iou.type==="given"?"↗️":"↙️"}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{iou.name}</div>
                <div style={{fontSize:11,color:T.muted}}>{iou.type==="given"?"Tune diya":"Tujhe dena hai"} • Due {iou.due?.slice(5)||"—"}</div>
              </div>
              <div className="outfit" style={{fontWeight:800,color:iou.type==="given"?"#00D9A6":"#FF6B6B",fontSize:15}}>{iou.type==="given"?"+":"−"}₹{iou.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── EXPENSES ─────────────────────────────────────────────
  const ExpensesScreen = () => {
    const bubbles=CATEGORIES.map(c=>({...c,total:expenses.filter(e=>e.category===c.id).reduce((s,e)=>s+e.amount,0)})).filter(b=>b.total>0).sort((a,b)=>b.total-a.total);
    const maxAmt=Math.max(...bubbles.map(b=>b.total),1);
    const POS=[{x:170,y:185},{x:70,y:145},{x:285,y:160},{x:125,y:320},{x:255,y:300},{x:65,y:285},{x:310,y:250}];
    const FL=["float1","float2","float3","float4","float5","float1","float3"];
    return(
      <div className="fade-in scroll-area">
        <div style={{padding:"52px 18px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div className="outfit" style={{fontSize:26,fontWeight:800}}>Expenses</div>
            <div className="toggle-group">
              {["list","bubbles"].map(v=>(
                <button key={v} className={`toggle-btn ${expView===v?"active":""}`} onClick={()=>setExpView(v)} style={{background:expView===v?(v==="list"?"#4F9EFF":"#A78BFA"):"transparent"}}>
                  {v==="list"?"≡ List":"◎ Bubbles"}
                </button>
              ))}
            </div>
          </div>
          {expView==="bubbles"?(
            expenses.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
                <div style={{fontSize:56,marginBottom:16}}>◎</div>
                <div className="outfit" style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:8}}>Koi bubble nahi abhi!</div>
                <div style={{fontSize:13}}>Expenses add karo toh bubbles dikhenge 😄</div>
              </div>
            ):(
              <div>
                <div style={{textAlign:"center",color:T.muted,fontSize:12,marginBottom:10}}>Size = kitna kharch • Tap karo • Shake karo! 😄</div>
                <div style={{position:"relative",height:440,background:dark?"rgba(79,158,255,0.03)":"rgba(79,158,255,0.05)",borderRadius:24,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16}}>
                  {bubbles.map((cat,i)=>{
                    const size=68+(cat.total/maxAmt)*88;
                    const pos=POS[i]||{x:100+i*45,y:200};
                    return(<div key={cat.id} className="bubble" style={{width:size,height:size,background:`radial-gradient(circle at 38% 38%, ${cat.color}CC, ${cat.color}55)`,border:`2px solid ${cat.color}90`,left:pos.x-size/2,top:pos.y-size/2,animation:`${FL[i]} ${4.5+i*0.8}s ease-in-out infinite`,boxShadow:`0 0 24px ${cat.color}35`}}>
                      <div style={{fontSize:size>100?26:18}}>{cat.icon}</div>
                      <div style={{fontSize:size>110?12:9,fontWeight:800,color:"#fff"}}>₹{cat.total}</div>
                    </div>);
                  })}
                </div>
              </div>
            )
          ):(
            <div>
              {expenses.length===0?(
                <div style={{textAlign:"center",padding:"50px 20px",color:T.muted}}>
                  <div style={{fontSize:56,marginBottom:16}}>💸</div>
                  <div className="outfit" style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:8}}>Abhi koi kharch nahi!</div>
                  <div style={{fontSize:13,lineHeight:1.7,marginBottom:24}}>Pehla expense add karo — neeche wala + button dabao 👇</div>
                  <button onClick={()=>setShowAdd(true)} style={{background:"linear-gradient(135deg,#4F9EFF,#00D9A6)",border:"none",borderRadius:16,padding:"13px 28px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Outfit"}}>+ Pehla Kharch Add Karo</button>
                </div>
              ):expenses.map(exp=>{
                const cat=CATEGORIES.find(c=>c.id===exp.category);
                return(
                  <div key={exp.id} className="card card-hover" style={{display:"flex",alignItems:"center",gap:13,marginBottom:9}}>
                    <div style={{width:46,height:46,borderRadius:15,background:`${cat.color}18`,border:`1px solid ${cat.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{cat.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{exp.note}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>
                        {cat.label} • {exp.date}
                        {exp.approvedByParent&&<span style={{color:"#00D9A6",marginLeft:6}}>✓ Approved</span>}
                      </div>
                    </div>
                    <div className="outfit" style={{fontWeight:800,color:"#FF6B6B",fontSize:16,flexShrink:0}}>₹{exp.amount}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── ANALYTICS ────────────────────────────────────────────
  const AnalyticsScreen = () => {
    const {g,c:gc,msg}=getGrade();
    return(
      <div className="fade-in scroll-area">
        <div style={{padding:"52px 18px 0"}}>
          <div className="outfit" style={{fontSize:26,fontWeight:800,marginBottom:18}}>Analytics</div>
          <div style={{background:"linear-gradient(135deg,#111f3e,#0b1424)",border:`2px solid ${gc}40`,borderRadius:26,padding:22,marginBottom:14,textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 0%, ${gc}10, transparent 70%)`}}/>
            <div style={{fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>This Month Report Card</div>
            <div className="outfit" style={{fontSize:90,fontWeight:900,color:gc,lineHeight:1,marginBottom:4,textShadow:`0 0 40px ${gc}50`}}>{g}</div>
            <div style={{color:T.text,fontSize:16,fontWeight:700,marginBottom:4}}>{msg}</div>
            <div style={{color:T.muted,fontSize:13}}>₹{totalSpent.toLocaleString()} of ₹{userBudget.toLocaleString()} budget</div>
          </div>
          <div className="toggle-group" style={{marginBottom:14}}>
            {["Hafte Bhar","Poora Mahina"].map((p,i)=>(
              <button key={p} className={`toggle-btn ${i===1?"active":""}`} style={{background:i===1?"#4F9EFF":"transparent"}}>{p}</button>
            ))}
          </div>
          {catTotals.length>0?(
            <div className="card" style={{marginBottom:14}}>
              <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:14}}>Category-wise Kharch</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catTotals} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {catTotals.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${v}`} contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,fontSize:13}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:4}}>
                {catTotals.map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:8,height:8,borderRadius:"50%",background:c.color}}/><span style={{fontSize:11,color:T.muted,fontWeight:600}}>{c.name} ₹{c.value}</span></div>))}
              </div>
            </div>
          ):(
            <div style={{textAlign:"center",padding:"30px 20px",background:T.card,border:`1px solid ${T.border}`,borderRadius:20,marginBottom:14}}>
              <div style={{fontSize:36,marginBottom:10}}>📊</div>
              <div style={{fontSize:14,color:T.muted}}>Expenses add karo toh charts dikhenge!</div>
            </div>
          )}
          <div className="card" style={{marginBottom:14}}>
            <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:14}}>Roz Ka Kharch</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={DAILY_DATA} margin={{top:5,right:5,bottom:0,left:-20}}>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F9EFF" stopOpacity={0.35}/><stop offset="95%" stopColor="#4F9EFF" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:T.muted,fontSize:11}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:T.muted,fontSize:10}}/>
                <Tooltip formatter={v=>[`₹${v}`,"Kharch"]} contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,fontSize:13}}/>
                <Area type="monotone" dataKey="amount" stroke="#4F9EFF" strokeWidth={2.5} fill="url(#ag)" dot={{fill:"#4F9EFF",r:4,strokeWidth:0}} activeDot={{r:6,fill:"#4F9EFF"}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(79,158,255,0.07),rgba(167,139,250,0.07))",border:"1px solid rgba(79,158,255,0.2)",borderRadius:20,padding:18,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{fontSize:20}}>🤖</span>
              <span className="outfit" style={{fontWeight:700,fontSize:15,color:"#4F9EFF"}}>Desi AI Insights</span>
            </div>
            {[
              {icon:"🍕",tip:"Bhai, canteen mein daily chai-snacks ₹80 ho raha hai — hafte mein ₹560! Ghar se mathri ya biscuit laao na yaar 😂"},
              {icon:"🎮",tip:"Entertainment pe lock kyun lagaya? Seedha baat — budget mein raho toh Papa ka WhatsApp nahi aayega! 😅"},
              {icon:"📈",tip:"Arre wah! Consistent tracking chal raha hai — Saver Pro badge bus ek hafte door hai bhai! 🏆"},
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                <span style={{fontSize:13,color:T.sub,lineHeight:1.6}}>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── KEEPER ───────────────────────────────────────────────
  const KeeperScreen = () => (
    <div className="fade-in scroll-area">
      <div style={{padding:"52px 18px 0"}}>
        <div style={{marginBottom:20}}>
          <div className="outfit" style={{fontSize:26,fontWeight:800,marginBottom:4}}>Keeper 🛡️</div>
          <div style={{fontSize:13,color:T.muted}}>Apne parents ke saath accountable raho</div>
        </div>
        {/* Master Toggle */}
        <div style={{background:keeperMasterOn?"linear-gradient(135deg,#1c0a0a,#2e1010)":dark?"linear-gradient(135deg,#111827,#0d1220)":"linear-gradient(135deg,#f8faff,#eef2ff)",border:`1.5px solid ${keeperMasterOn?"rgba(255,107,107,0.4)":T.border}`,borderRadius:26,padding:20,marginBottom:16,position:"relative",overflow:"hidden"}}>
          {keeperMasterOn&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 20%, rgba(255,107,107,0.1), transparent 65%)"}}/>}
          <div style={{position:"relative",display:"flex",alignItems:"center",gap:14,marginBottom:keeperMasterOn?16:0}}>
            <div style={{width:58,height:58,borderRadius:18,background:keeperMasterOn?"rgba(255,107,107,0.2)":dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>
              {keeperMasterOn?"🔒":"🔓"}
            </div>
            <div style={{flex:1}}>
              <div className="outfit" style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:3}}>Keeper {keeperMasterOn?<span style={{color:"#00D9A6"}}>Active hai</span>:<span style={{color:T.muted}}>Band hai</span>}</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.55}}>{keeperMasterOn?`${lockedCount} categories locked • WhatsApp approval active`:"Sab unlock hai"}</div>
            </div>
            <button className="sw-toggle" onClick={()=>setKeeperMasterOn(v=>!v)} style={{background:keeperMasterOn?"#FF6B6B":T.muted}}>
              <div className="sw-knob" style={{left:keeperMasterOn?"22px":"3px"}}/>
            </button>
          </div>
          {keeperMasterOn&&(
            <div style={{borderTop:"1px solid rgba(255,107,107,0.2)",paddingTop:14,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>📱</span>
              <span style={{fontSize:13,color:T.sub}}>Alert: <strong style={{color:T.text}}>{parentPhone||"Not set"}</strong></span>
            </div>
          )}
        </div>
        {/* WhatsApp */}
        <div className="card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:13,background:"rgba(37,211,102,0.14)",border:"1px solid rgba(37,211,102,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:T.text}}>WhatsApp Approval</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>Locked category spend karne pe parent ko real message jayega</div>
          </div>
          <button className="sw-toggle" onClick={()=>setWhatsappOn(v=>!v)} style={{background:whatsappOn?"#25D366":T.muted}}>
            <div className="sw-knob" style={{left:whatsappOn?"22px":"3px"}}/>
          </button>
        </div>
        {/* Category locks */}
        <div style={{marginBottom:12}}>
          <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:4}}>Category Locks</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Tap any category to set limit aur lock karo 👇</div>
          {CATEGORIES.map(cat=>{
            const k=keeper[cat.id];
            const catSpent=expenses.filter(e=>e.category===cat.id).reduce((s,e)=>s+e.amount,0);
            const pct=Math.min((catSpent/k.limit)*100,100);
            const isLocked=k.locked&&keeperMasterOn;
            const isWarn=pct>=80&&!isLocked;
            return(
              <div key={cat.id} className="keeper-row" onClick={()=>openKeeperEdit(cat.id)}
                style={{background:isLocked?dark?"rgba(255,107,107,0.06)":"rgba(255,107,107,0.04)":"transparent",border:`1px solid ${isLocked?"rgba(255,107,107,0.2)":"transparent"}`}}>
                <div style={{width:44,height:44,borderRadius:14,background:`${cat.color}18`,border:`1px solid ${cat.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:14,color:T.text}}>{cat.label}</span>
                    <span style={{fontSize:12,color:pct>=100?"#FF6B6B":pct>=80?"#FFB800":T.muted,fontWeight:600}}>₹{catSpent}/₹{k.limit}</span>
                  </div>
                  <div className="prog-bg"><div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:pct>=100?"#FF6B6B":pct>=80?"#FFB800":cat.color,transition:"width 0.6s"}}/></div>
                  {k.parentApproval&&keeperMasterOn&&<div style={{fontSize:10,color:"#FF8C42",marginTop:4,fontWeight:600}}>⚡ WhatsApp approval needed to spend here</div>}
                </div>
                <div style={{width:28,height:28,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:isLocked?"rgba(255,107,107,0.18)":isWarn?"rgba(255,184,0,0.15)":dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",marginLeft:6}}>
                  {isLocked?"🔒":isWarn?"⚠️":"🔓"}
                </div>
              </div>
            );
          })}
        </div>
        {/* Recent Alerts */}
        <div className="card" style={{marginBottom:20}}>
          <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:14}}>Recent Alerts 📲</div>
          {expenses.filter(e=>e.approvedByParent).length===0?(
            <div style={{textAlign:"center",padding:"16px 0",color:T.muted,fontSize:13}}>Abhi koi approval alerts nahi</div>
          ):expenses.filter(e=>e.approvedByParent).slice(0,3).map((e,i)=>{
            const cat=CATEGORIES.find(c=>c.id===e.category);
            return(<div key={i} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:i<2?`1px solid ${T.border}`:"none",alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0}}>✅</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:T.text,fontWeight:500}}>Parent ne ₹{e.amount} {cat?.label} approve kiya</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{e.date}</div>
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );

  // ── PROFILE ──────────────────────────────────────────────
  const ProfileScreen = () => (
    <div className="fade-in scroll-area">
      <div style={{padding:"52px 18px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
          <div style={{width:68,height:68,borderRadius:22,background:"linear-gradient(135deg,#4F9EFF,#00D9A6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:900,color:"#fff",fontFamily:"Outfit",flexShrink:0,boxShadow:"0 8px 24px rgba(79,158,255,0.35)"}}>
            {userName[0]?.toUpperCase()||"S"}
          </div>
          <div>
            <div className="outfit" style={{fontSize:22,fontWeight:800}}>{userName}</div>
            <div style={{fontSize:13,color:T.muted,marginTop:2}}>{userCollege}{userYear?` • ${userYear} Year`:""}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
              <span style={{fontSize:16}}>🔥</span>
              <span style={{fontSize:13,color:"#FF8C42",fontWeight:700}}>{streak}-Day Streak!</span>
              <div style={{width:4,height:4,borderRadius:"50%",background:T.muted}}/>
              <span style={{fontSize:12,color:T.muted}}>Level {Math.floor(expenses.length/3)+1}</span>
            </div>
          </div>
        </div>
        <div className="card" style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div className="outfit" style={{fontWeight:700,fontSize:15}}>Achievements 🏆</div>
            <div style={{fontSize:12,color:T.muted}}>{BADGES.filter(b=>b.earned).length}/{BADGES.length} earn kiye</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {BADGES.map(b=>(<div key={b.id} className={`badge-card ${b.earned?"badge-on":"badge-off"}`}>
              <div style={{fontSize:30,filter:b.earned?"none":"grayscale(1)",marginBottom:2}}>{b.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:b.earned?T.text:T.muted,lineHeight:1.3}}>{b.title}</div>
              {!b.earned&&<div style={{fontSize:9,color:T.muted}}>🔒 Locked</div>}
            </div>))}
          </div>
        </div>
        <div className="card" style={{marginBottom:14}}>
          <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:14}}>Weekly Challenges ⚡</div>
          {CHALLENGES.map((ch,i)=>(<div key={ch.id} style={{padding:"12px 0",borderBottom:i<CHALLENGES.length-1?`1px solid ${T.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontWeight:700,fontSize:14,color:T.text}}>{ch.title}</div>
              {ch.done&&<span className="chip up" style={{fontSize:10}}>✓ Ho gaya!</span>}
            </div>
            <div style={{fontSize:12,color:T.muted,marginBottom:8}}>{ch.desc}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
              <div style={{flex:1,height:6,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(ch.progress/ch.total)*100}%`,background:ch.done?"linear-gradient(90deg,#00D9A6,#4F9EFF)":"linear-gradient(90deg,#4F9EFF,#A78BFA)",borderRadius:3}}/>
              </div>
              <span style={{fontSize:11,color:T.muted,fontWeight:600,flexShrink:0}}>{ch.progress}/{ch.total}</span>
            </div>
            <div style={{fontSize:11,color:"#FFB800",fontWeight:600}}>Reward: {ch.reward}</div>
          </div>))}
        </div>
        <div className="card" style={{marginBottom:20}}>
          <div className="outfit" style={{fontWeight:700,fontSize:15,marginBottom:14}}>Settings ⚙️</div>
          {[
            {icon:dark?"☀️":"🌙",label:dark?"Light Mode pe switch karo":"Dark Mode pe switch karo",right:<button className="sw-toggle" onClick={()=>setDark(!dark)} style={{background:dark?"#4F9EFF":T.muted}}><div className="sw-knob" style={{left:dark?"22px":"3px"}}/></button>},
            {icon:"💬",label:"WhatsApp Approval Alerts",right:<button className="sw-toggle" onClick={()=>setWhatsappOn(v=>!v)} style={{background:whatsappOn?"#25D366":T.muted}}><div className="sw-knob" style={{left:whatsappOn?"22px":"3px"}}/></button>},
            {icon:"🛡️",label:"Keeper Mode",right:<span onClick={()=>setScreen("keeper")} style={{color:"#4F9EFF",fontSize:13,cursor:"pointer",fontWeight:600}}>Manage ›</span>},
            {icon:"👨‍👩‍👦",label:"Parent ka Number",right:<span style={{color:T.muted,fontSize:13}}>{parentPhone?parentPhone.slice(0,6)+"...":"Not set"} ›</span>},
            {icon:"🚪",label:"Logout",right:<span onClick={onLogout} style={{color:"#FF6B6B",fontSize:13,cursor:"pointer",fontWeight:600}}>Logout ›</span>},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",cursor:"pointer",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:20,width:28,textAlign:"center",flexShrink:0}}>{s.icon}</span>
              <span style={{flex:1,fontSize:14,color:T.text,fontWeight:500}}>{s.label}</span>
              {s.right}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SCREENS={home:HomeScreen,expenses:ExpensesScreen,analytics:AnalyticsScreen,keeper:KeeperScreen,profile:ProfileScreen};
  const ActiveScreen=SCREENS[screen];
  const NAV=[{id:"home",e:"🏠",l:"Home"},{id:"expenses",e:"💳",l:"Spends"},{id:"analytics",e:"📊",l:"Stats"},{id:"keeper",e:"🛡️",l:"Keeper"},{id:"profile",e:"👤",l:"Profile"}];
  const editCat=editingCat?CATEGORIES.find(c=>c.id===editingCat):null;

  return(
    <>
      <style>{css}</style>
      <div className="sw-app">
        <ActiveScreen/>

        <button className="fab" onClick={()=>setShowAdd(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        <div className="bottom-nav">
          {NAV.map(n=>(<div key={n.id} className={`nav-item ${screen===n.id?"active":""}`} onClick={()=>setScreen(n.id)}>
            <span style={{fontSize:24}}>{n.e}</span>
            <div className="nav-label">{n.l}</div>
            <div className="nav-pip"/>
          </div>))}
        </div>

        {/* ── PARENT APPROVAL WAITING MODAL ─────────────── */}
        {showApprovalWait&&(
          <div className="modal-overlay">
            <div className="modal">
              {approvalGranted?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{animation:"checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",display:"inline-block",marginBottom:20}}>
                    <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#00D9A6,#4F9EFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto",boxShadow:"0 12px 32px rgba(0,217,166,0.4)"}}>✓</div>
                  </div>
                  <div className="outfit" style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:6}}>Approved! Kharch add ho gaya 🎉</div>
                  <div style={{color:T.muted,fontSize:14}}>Parent ne allow kiya — thanks!</div>
                </div>
              ):(
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                    <div className="outfit" style={{fontSize:20,fontWeight:800,color:T.text}}>Parent Approval 🛡️</div>
                    <button onClick={()=>{setShowApprovalWait(false);setPendingApproval(null);}} style={{background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 10px",cursor:"pointer",color:T.muted,fontSize:16}}>✕</button>
                  </div>

                  {/* Request summary */}
                  {pendingApproval&&(
                    <div style={{background:"rgba(255,184,0,0.07)",border:"1px solid rgba(255,184,0,0.2)",borderRadius:18,padding:16,marginBottom:20}}>
                      <div style={{fontSize:11,color:"#FFB800",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📋 Request Sent</div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{fontSize:30}}>{CATEGORIES.find(c=>c.id===pendingApproval.category)?.icon||"💸"}</div>
                        <div>
                          <div className="outfit" style={{fontSize:24,fontWeight:900,color:"#FFB800"}}>₹{pendingApproval.amount}</div>
                          <div style={{fontSize:13,color:T.muted}}>{pendingApproval.category} • {pendingApproval.note}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{background:"rgba(37,211,102,0.07)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:16,padding:14,marginBottom:20,fontSize:13,color:T.sub,lineHeight:1.7}}>
                    📱 <strong style={{color:"#25D366"}}>WhatsApp message</strong> parent ko bheja gaya hai! Unke paas <strong>Allow/Deny</strong> buttons hain. Allow karne pe woh ek <strong>approval code</strong> share karenge — wahi neeche daalo.
                  </div>

                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:12,color:T.muted,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Parent ne jo code bheja, woh daalo 👇</div>
                    <input className="code-input" placeholder="XXXXXX" value={approvalInput} onChange={e=>{ setApprovalInput(e.target.value.toUpperCase()); setApprovalError(""); }} maxLength={6}/>
                    {approvalError&&<div style={{color:"#FF6B6B",fontSize:12,marginTop:8,fontWeight:600,textAlign:"center"}}>{approvalError}</div>}
                  </div>

                  <button className="btn-main" onClick={verifyApprovalCode} style={{marginBottom:12,marginTop:12}}>
                    ✓ Verify Karo &amp; Expense Add Karo
                  </button>

                  <div style={{textAlign:"center",fontSize:12,color:T.muted}}>
                    Code nahi aaya? Parent ko WhatsApp pe{" "}
                    <span onClick={()=>{
                      const cat=CATEGORIES.find(c=>c.id===pendingApproval?.category);
                      const msg=`🛡️ SpentWell Keeper Alert\n\n${userName} chahta/chahti hai ₹${pendingApproval?.amount} ${cat?.label} pe spend karna.\n\nKya aap allow karte hain? Unhe WhatsApp karo with code.`;
                      window.open(`https://wa.me/${cleanPhone(parentPhone)}?text=${encodeURIComponent(msg)}`,"_blank");
                    }} style={{color:"#4F9EFF",fontWeight:700,cursor:"pointer"}}>remind karo</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── KEEPER EDIT MODAL ─────────────────────────── */}
        {showKeeperModal&&editCat&&(
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowKeeperModal(false)}>
            <div className="modal">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:28}}>{editCat.icon}</span>
                  <div className="outfit" style={{fontSize:20,fontWeight:800,color:T.text}}>{editCat.label} Keeper</div>
                </div>
                <button onClick={()=>setShowKeeperModal(false)} style={{background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 10px",cursor:"pointer",color:T.muted,fontSize:16}}>✕</button>
              </div>
              <div style={{background:keeperEdit.locked?"rgba(255,107,107,0.08)":dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",border:`1px solid ${keeperEdit.locked?"rgba(255,107,107,0.3)":T.border}`,borderRadius:18,padding:16,marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:32}}>{keeperEdit.locked?"🔒":"🔓"}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:T.text,marginBottom:3}}>{keeperEdit.locked?"Category Locked hai":"Category Open hai"}</div>
                  <div style={{fontSize:12,color:T.muted}}>{keeperEdit.locked?"Spend karne pe parents ko WhatsApp jayega":"Koi restriction nahi abhi"}</div>
                </div>
                <button className="sw-toggle" onClick={()=>setKeeperEdit(k=>({...k,locked:!k.locked}))} style={{background:keeperEdit.locked?"#FF6B6B":T.muted}}>
                  <div className="sw-knob" style={{left:keeperEdit.locked?"22px":"3px"}}/>
                </button>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:T.text}}>Monthly Limit</span><span className="outfit" style={{fontSize:16,fontWeight:800,color:editCat.color}}>₹{keeperEdit.limit}</span></div>
                <input type="range" className="range-input" min={100} max={3000} step={50} value={keeperEdit.limit} onChange={e=>setKeeperEdit(k=>({...k,limit:+e.target.value}))}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted,marginTop:5}}><span>₹100</span><span>₹3,000</span></div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:T.text}}>Alert at</span><span className="outfit" style={{fontSize:16,fontWeight:800,color:"#FFB800"}}>₹{keeperEdit.alert}</span></div>
                <input type="range" className="range-input" min={50} max={keeperEdit.limit-50} step={50} value={keeperEdit.alert} onChange={e=>setKeeperEdit(k=>({...k,alert:+e.target.value}))}/>
                <div style={{fontSize:12,color:T.muted,marginTop:6}}>⚠️ ₹{keeperEdit.alert} pe parents ko warning alert jayega</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",borderRadius:14,padding:"13px 15px",marginBottom:22}}>
                <span style={{fontSize:20}}>👨‍👩‍👦</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:T.text}}>WhatsApp Approval Required</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:2}}>Spend karne se pehle parent ko WhatsApp jayega — Allow/Deny</div>
                </div>
                <button className="sw-toggle" onClick={()=>setKeeperEdit(k=>({...k,parentApproval:!k.parentApproval}))} style={{background:keeperEdit.parentApproval?"#4F9EFF":T.muted}}>
                  <div className="sw-knob" style={{left:keeperEdit.parentApproval?"22px":"3px"}}/>
                </button>
              </div>
              <button className="btn-main" onClick={saveKeeperEdit} style={{background:keeperEdit.locked?"linear-gradient(135deg,#FF6B6B,#FF8C42)":"linear-gradient(135deg,#4F9EFF,#00D9A6)"}}>
                {keeperEdit.locked?"🔒 Lock Karo & Save":"✓ Save Karo"}
              </button>
            </div>
          </div>
        )}

        {/* ── ADD EXPENSE MODAL ─────────────────────────── */}
        {showAdd&&(
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
            <div className="modal">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div className="outfit" style={{fontSize:22,fontWeight:800,color:T.text}}>Kharch Log Karo</div>
                <button onClick={()=>setShowAdd(false)} style={{background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 10px",cursor:"pointer",color:T.muted,fontSize:16}}>✕</button>
              </div>

              {/* Show keeper warning if locked category selected */}
              {keeper[form.category]?.locked&&keeper[form.category]?.parentApproval&&keeperMasterOn&&(
                <div style={{background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:14,padding:"10px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,flexShrink:0}}>🛡️</span>
                  <div style={{fontSize:13,color:"#FFB800",lineHeight:1.6}}>
                    Ye category locked hai. Save karne pe <strong>WhatsApp approval</strong> parent ko jayega!
                  </div>
                </div>
              )}

              <div style={{textAlign:"center",marginBottom:18}}>
                <div style={{fontSize:11,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>Amount Daalo</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <span className="outfit" style={{fontSize:52,fontWeight:900,color:"#4F9EFF"}}>₹</span>
                  <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} autoFocus style={{background:"none",border:"none",fontSize:52,fontWeight:900,color:T.text,width:180,outline:"none",fontFamily:"Outfit, sans-serif",textAlign:"center"}} placeholder="0"/>
                </div>
                <button onClick={()=>{setListening(!listening);setTimeout(()=>setListening(false),3000);}} style={{background:listening?"rgba(255,107,107,0.18)":"rgba(79,158,255,0.12)",border:`1px solid ${listening?"#FF6B6B55":"rgba(79,158,255,0.3)"}`,borderRadius:20,padding:"7px 18px",color:listening?"#FF6B6B":"#4F9EFF",cursor:"pointer",fontSize:13,fontWeight:700,marginTop:8}}>
                  {listening?"🔴 Sun raha hoon…":"🎤 Voice se bolo"}
                </button>
              </div>

              <div className="toggle-group" style={{marginBottom:16}}>
                {["expense","income"].map(t=>(
                  <button key={t} className={`toggle-btn ${form.type===t?"active":""}`} onClick={()=>setForm(f=>({...f,type:t}))} style={{background:form.type===t?(t==="expense"?"#FF6B6B":"#00D9A6"):"transparent"}}>
                    {t==="expense"?"📤 Gaya":"📥 Aaya"}
                  </button>
                ))}
              </div>

              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:T.muted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Category</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {CATEGORIES.map(cat=>(
                    <button key={cat.id} onClick={()=>setForm(f=>({...f,category:cat.id}))} className="cat-chip" style={{borderColor:form.category===cat.id?cat.color:T.border,background:form.category===cat.id?`${cat.color}1E`:"transparent",color:form.category===cat.id?cat.color:T.muted}}>
                      {cat.icon} {cat.label}
                      {keeper[cat.id]?.locked&&keeperMasterOn&&" 🔒"}
                    </button>
                  ))}
                </div>
              </div>

              <input className="input-f" placeholder="Kahan kharch kiya? (e.g. Canteen mein lunch)" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{marginBottom:18}}/>

              <button className="btn-main" onClick={addExpense} style={{background:keeper[form.category]?.locked&&keeper[form.category]?.parentApproval&&keeperMasterOn?"linear-gradient(135deg,#FF6B6B,#FF8C42)":"linear-gradient(135deg,#4F9EFF,#00D9A6)"}}>
                {keeper[form.category]?.locked&&keeper[form.category]?.parentApproval&&keeperMasterOn?"🛡️ Parent Approval Request Bhejo":"Save Karo ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ── IOU MODAL ────────────────────────────────── */}
        {showIOU&&(
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowIOU(false)}>
            <div className="modal">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                <div className="outfit" style={{fontSize:22,fontWeight:800,color:T.text}}>IOU Tracker 🤝</div>
                <button onClick={()=>setShowIOU(false)} style={{background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 10px",cursor:"pointer",color:T.muted,fontSize:16}}>✕</button>
              </div>
              <div className="toggle-group" style={{marginBottom:16}}>
                {["given","borrowed"].map(t=>(
                  <button key={t} className={`toggle-btn ${iouForm.type===t?"active":""}`} onClick={()=>setIouForm(f=>({...f,type:t}))} style={{background:iouForm.type===t?(t==="given"?"#00D9A6":"#FF6B6B"):"transparent"}}>
                    {t==="given"?"↗ Maine diya":"↙ Mujhe dena hai"}
                  </button>
                ))}
              </div>
              <input className="input-f" placeholder="Yaar ka naam" value={iouForm.name} onChange={e=>setIouForm(f=>({...f,name:e.target.value}))} style={{marginBottom:10}}/>
              <input type="number" className="input-f" placeholder="Kitna (₹)" value={iouForm.amount} onChange={e=>setIouForm(f=>({...f,amount:e.target.value}))} style={{marginBottom:10}}/>
              <input className="input-f" placeholder="Note (optional)" value={iouForm.note} onChange={e=>setIouForm(f=>({...f,note:e.target.value}))} style={{marginBottom:10}}/>
              <input type="date" className="input-f" value={iouForm.due} onChange={e=>setIouForm(f=>({...f,due:e.target.value}))} style={{marginBottom:18}}/>
              <button className="btn-main" style={{background:iouForm.type==="given"?"linear-gradient(135deg,#00D9A6,#4F9EFF)":"linear-gradient(135deg,#FF6B6B,#FF8C42)"}} onClick={addIOU}>Save Karo ✓</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
