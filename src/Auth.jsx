import { useState, useEffect } from "react";

// ── Helpers ────────────────────────────────────────────────
const getUsers  = () => JSON.parse(localStorage.getItem("sw_users") || "{}");
const saveUsers = (u) => localStorage.setItem("sw_users", JSON.stringify(u));

export default function Auth({ onLogin }) {
  const [mode, setMode]       = useState("splash");
  const [step, setStep]       = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", email: "", college: "",
    year: "", password: "", confirm: "", parentPhone: "",
    monthlyBudget: "5000",
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setAuthError("");
  };

  useEffect(() => {
    if (mode === "splash") {
      const t = setTimeout(() => setMode("welcome"), 2400);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const validateLogin = () => {
    const e = {};
    if (!form.phone) e.phone = "Phone ya email daalo bhai";
    if (!form.password) e.password = "Password toh chahiye yaar";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Naam toh batao apna!";
    if (!form.phone || form.phone.length < 10) e.phone = "Valid 10-digit number daalo";
    if (!form.email.includes("@")) e.email = "Sahi email daalo yaar";
    if (!form.college.trim()) e.college = "College ka naam daalo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.password || form.password.length < 6) e.password = "6+ characters ka password banana bhai";
    if (form.password !== form.confirm) e.confirm = "Dono password match nahi kar rahe!";
    if (!form.parentPhone || form.parentPhone.length < 10) e.parentPhone = "Parent ka number zaroori hai (Keeper ke liye)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLogin = () => {
    if (!validateLogin()) return;
    setLoading(true);
    setAuthError("");
    setTimeout(() => {
      const users  = getUsers();
      const userId = Object.keys(users).find(
        k => users[k].phone === form.phone || users[k].email === form.phone
      );
      const user = userId ? users[userId] : null;
      if (!user) { setLoading(false); setAuthError("❌ Account nahi mila! Pehle register karo."); return; }
      if (user.password !== form.password) { setLoading(false); setAuthError("❌ Wrong password bhai!"); return; }
      setLoading(false); setSuccess(true);
      setTimeout(() => onLogin({ ...user, userId: user.phone }), 900);
    }, 1000);
  };

  // ── REGISTER ──────────────────────────────────────────
  const handleRegisterSubmit = () => {
    if (!validateStep2()) return;
    setLoading(true);
    setAuthError("");
    setTimeout(() => {
      const users = getUsers();
      if (users[form.phone]) { setLoading(false); setAuthError("❌ Is phone se account hai! Login karo."); return; }
      const userId = form.phone;
      const newUser = {
        name: form.name.trim(), phone: form.phone, email: form.email,
        college: form.college.trim(), year: form.year, password: form.password,
        parentPhone: form.parentPhone, monthlyBudget: form.monthlyBudget,
        registeredAt: Date.now(),
      };
      users[userId] = newUser;
      saveUsers(users);
      localStorage.setItem(`sw_data_${userId}`, JSON.stringify({
        expenses: [], ious: [],
        keeper: {
          food:          { locked: false, limit: 500,  alert: 400, parentApproval: false },
          transport:     { locked: false, limit: 300,  alert: 200, parentApproval: false },
          entertainment: { locked: true,  limit: 200,  alert: 150, parentApproval: true  },
          shopping:      { locked: true,  limit: 300,  alert: 200, parentApproval: true  },
          study:         { locked: false, limit: 1000, alert: 800, parentApproval: false },
          health:        { locked: false, limit: 500,  alert: 400, parentApproval: false },
          other:         { locked: false, limit: 200,  alert: 150, parentApproval: false },
        },
        keeperMasterOn: true, whatsappOn: true,
      }));
      setLoading(false); setSuccess(true);
      setTimeout(() => onLogin({ ...newUser, userId }), 900);
    }, 1200);
  };

  const handleRegisterNext = () => { if (validateStep1()) setStep(2); };

  // ─── CSS ───────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    ::-webkit-scrollbar{width:0;}
    input[type=number]::-webkit-inner-spin-button{display:none;}

    @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes scaleIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.25) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
    @keyframes orb1{0%,100%{transform:translate(0,0)}33%{transform:translate(30px,-20px)}66%{transform:translate(-15px,25px)}}
    @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-25px,-30px)}}

    .auth-root{background:#070B14;color:#F0F4FF;min-height:100vh;max-width:430px;margin:0 auto;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;}
    .outfit{font-family:'Outfit',sans-serif;}
    .inp{background:rgba(255,255,255,0.05);border:1.5px solid rgba(79,158,255,0.18);border-radius:16px;padding:14px 16px;color:#F0F4FF;font-size:15px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:all 0.22s;}
    .inp:focus{border-color:#4F9EFF;background:rgba(79,158,255,0.07);box-shadow:0 0 0 3px rgba(79,158,255,0.1);}
    .inp::placeholder{color:#4A5568;}
    .inp.err{border-color:#FF6B6B;background:rgba(255,107,107,0.06);}
    .inp-wrap{position:relative;width:100%;}
    .inp-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none;}
    .inp-wrap .inp{padding-left:44px;}
    .inp-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:16px;color:#4A5568;background:none;border:none;}
    .btn-primary{background:linear-gradient(135deg,#4F9EFF,#00D9A6);border:none;border-radius:16px;padding:16px;color:#fff;font-size:16px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;width:100%;transition:all 0.22s;}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(79,158,255,0.45);}
    .btn-primary:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
    .btn-ghost{background:rgba(255,255,255,0.05);border:1.5px solid rgba(79,158,255,0.2);border-radius:16px;padding:15px;color:#CBD5E1;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;width:100%;transition:all 0.22s;}
    .btn-ghost:hover{border-color:rgba(79,158,255,0.5);color:#F0F4FF;}
    .btn-social{display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:16px;padding:13px;color:#CBD5E1;font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
    .err-text{color:#FF6B6B;font-size:11.5px;margin-top:5px;margin-left:4px;font-weight:500;}
    .auth-err{background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.3);border-radius:14px;padding:12px 16px;color:#FF6B6B;font-size:13px;font-weight:600;margin-bottom:16px;text-align:center;}
    .label{font-size:12px;color:#64748B;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:7px;}
    .divider{display:flex;align-items:center;gap:12px;margin:4px 0;}
    .divider-line{flex:1;height:1px;background:rgba(255,255,255,0.07);}
    .divider-text{font-size:12px;color:#4A5568;font-weight:500;}
    .fade-up{animation:fadeUp 0.45s ease forwards;}
    .scroll{overflow-y:auto;height:100vh;padding-bottom:30px;}
    .step-bar{display:flex;gap:6px;margin-bottom:24px;}
    .step-seg{flex:1;height:3px;border-radius:2px;transition:background 0.4s;}
    .success-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;animation:fadeIn 0.3s ease;}
    .range-input{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;}
    .range-input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4F9EFF,#00D9A6);cursor:pointer;box-shadow:0 2px 8px rgba(79,158,255,0.4);}
  `;

  const SuccessOverlay = ({ msg }) => (
    <div className="success-overlay">
      <div style={{ animation: "checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#00D9A6,#4F9EFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, marginBottom: 24, boxShadow: "0 16px 40px rgba(0,217,166,0.4)" }}>✓</div>
      </div>
      <div className="outfit" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>{msg}</div>
      <div style={{ color: "#64748B", fontSize: 14 }}>SpentWell mein welcome hai! 🎉</div>
    </div>
  );

  // ── SPLASH ──────────────────────────────────────────────
  if (mode === "splash") return (
    <>
      <style>{css}</style>
      <div className="auth-root" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(79,158,255,0.12)", filter: "blur(60px)", animation: "orb1 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 160, height: 160, borderRadius: "50%", background: "rgba(0,217,166,0.1)", filter: "blur(50px)", animation: "orb2 7s ease-in-out infinite" }} />
        <div style={{ animation: "float 3s ease-in-out infinite", marginBottom: 28 }}>
          <div style={{ width: 90, height: 90, borderRadius: 28, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px rgba(79,158,255,0.4)" }}>
            <span style={{ fontSize: 44 }}>💸</span>
          </div>
        </div>
        <div className="outfit" style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, marginBottom: 8, animation: "fadeUp 0.6s 0.2s ease both" }}>
          Spent<span style={{ color: "#4F9EFF" }}>Well</span>
        </div>
        <div style={{ color: "#64748B", fontSize: 14, animation: "fadeUp 0.6s 0.4s ease both" }}>Student ka sabse smart wallet 🧠</div>
        <div style={{ position: "absolute", bottom: 50, display: "flex", gap: 6, animation: "pulse 1.5s ease infinite" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === 1 ? "#4F9EFF" : "rgba(79,158,255,0.3)" }} />)}
        </div>
      </div>
    </>
  );

  // ── WELCOME ─────────────────────────────────────────────
  if (mode === "welcome") return (
    <>
      <style>{css}</style>
      <div className="auth-root" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(79,158,255,0.08)", filter: "blur(80px)", animation: "orb1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 100, left: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(0,217,166,0.07)", filter: "blur(60px)", animation: "orb2 9s ease-in-out infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 20px" }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 44px rgba(79,158,255,0.38)", marginBottom: 20, animation: "scaleIn 0.5s 0.1s ease both" }}>
            <span style={{ fontSize: 38 }}>💸</span>
          </div>
          <div className="outfit" style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, marginBottom: 6, textAlign: "center", animation: "fadeUp 0.5s 0.2s ease both" }}>
            Spent<span style={{ color: "#4F9EFF" }}>Well</span>
          </div>
          <div style={{ color: "#64748B", fontSize: 14, marginBottom: 40, textAlign: "center", animation: "fadeUp 0.5s 0.3s ease both" }}>Student ka sabse smart wallet 🧠</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", animation: "fadeUp 0.5s 0.4s ease both" }}>
            {[
              { icon: "🤖", title: "Desi AI Tips", sub: "Hinglish mein money advice" },
              { icon: "🛡️", title: "Keeper + Parent Alerts", sub: "Real WhatsApp approval system" },
              { icon: "◎", title: "Bubble Analytics", sub: "Visual spending tracker" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(79,158,255,0.1)", borderRadius: 18, padding: "13px 16px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,rgba(79,158,255,0.15),rgba(0,217,166,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#F0F4FF" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0 24px 44px", animation: "fadeUp 0.5s 0.6s ease both" }}>
          <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setMode("register")}>Shuru Karte Hain 🚀</button>
          <button className="btn-ghost" onClick={() => setMode("login")}>Pehle se account hai? Login karo</button>
        </div>
      </div>
    </>
  );

  // ── LOGIN ────────────────────────────────────────────────
  if (mode === "login") return (
    <>
      <style>{css}</style>
      <div className="auth-root">
        {success && <SuccessOverlay msg="Wapas aa gaye! 👋" />}
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(79,158,255,0.08)", filter: "blur(60px)", animation: "orb1 7s ease-in-out infinite" }} />
        <div className="scroll">
          <div style={{ padding: "54px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <button onClick={() => setMode("welcome")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#CBD5E1", fontSize: 18, flexShrink: 0 }}>←</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💸</div>
                <span className="outfit" style={{ fontSize: 20, fontWeight: 800 }}>Spent<span style={{ color: "#4F9EFF" }}>Well</span></span>
              </div>
            </div>
            <div className="fade-up">
              <div className="outfit" style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Wapas aa gaye! 👋</div>
              <div style={{ color: "#64748B", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Login karo aur apna kharch track karo</div>

              {authError && <div className="auth-err">{authError}</div>}

              <div style={{ marginBottom: 16 }}>
                <div className="label">Email Address</div>
                <div className="inp-wrap">
                  <span className="inp-icon">✉️</span>
                  <input className={`inp ${errors.phone ? "err" : ""}`} type="email" placeholder="Apna email daalo" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
                {errors.phone && <div className="err-text">⚠ {errors.phone}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div className="label">Password</div>
                <div className="inp-wrap">
                  <span className="inp-icon">🔐</span>
                  <input className={`inp ${errors.password ? "err" : ""}`} type={showPass ? "text" : "password"} placeholder="Apna password daalo" value={form.password} onChange={e => set("password", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  <button className="inp-eye" onClick={() => setShowPass(v => !v)}>{showPass ? "🙈" : "👁️"}</button>
                </div>
                {errors.password && <div className="err-text">⚠ {errors.password}</div>}
              </div>
              <div style={{ textAlign: "right", marginBottom: 26 }}>
                <span style={{ fontSize: 13, color: "#4F9EFF", cursor: "pointer", fontWeight: 600 }}>Password bhool gaye? 😅</span>
              </div>
              <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ marginBottom: 20 }}>
                {loading ? <span style={{ animation: "pulse 1s infinite" }}>Checking…</span> : "Login Karo →"}
              </button>
              <div style={{ textAlign: "center", fontSize: 14, color: "#64748B", marginTop: 8 }}>
                Naya account?{" "}
                <span style={{ color: "#4F9EFF", fontWeight: 700, cursor: "pointer" }} onClick={() => { setMode("register"); setStep(1); setAuthError(""); }}>Register karo yaar!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ── REGISTER ────────────────────────────────────────────
  if (mode === "register") return (
    <>
      <style>{css}</style>
      <div className="auth-root">
        {success && <SuccessOverlay msg="Account ban gaya! 🎉" />}
        <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(0,217,166,0.08)", filter: "blur(60px)", animation: "orb1 7s ease-in-out infinite" }} />
        <div className="scroll">
          <div style={{ padding: "54px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <button onClick={() => step === 2 ? setStep(1) : setMode("welcome")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#CBD5E1", fontSize: 18, flexShrink: 0 }}>←</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💸</div>
                <span className="outfit" style={{ fontSize: 20, fontWeight: 800 }}>Spent<span style={{ color: "#4F9EFF" }}>Well</span></span>
              </div>
            </div>
            <div className="step-bar">
              <div className="step-seg" style={{ background: "linear-gradient(90deg,#4F9EFF,#00D9A6)" }} />
              <div className="step-seg" style={{ background: step === 2 ? "linear-gradient(90deg,#4F9EFF,#00D9A6)" : "rgba(255,255,255,0.07)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <div className="outfit" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{step === 1 ? "Pehle milte hain! 😄" : "Almost done yaar! 🎯"}</div>
                <div style={{ color: "#64748B", fontSize: 13 }}>{step === 1 ? "Apni basic info bharo" : "Security aur budget set karo"}</div>
              </div>
              <div style={{ background: "rgba(79,158,255,0.12)", border: "1px solid rgba(79,158,255,0.25)", borderRadius: 20, padding: "4px 12px" }}>
                <span className="outfit" style={{ fontSize: 13, fontWeight: 700, color: "#4F9EFF" }}>Step {step}/2</span>
              </div>
            </div>

            {authError && <div className="auth-err">{authError}</div>}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="fade-up">
                <div style={{ marginBottom: 16 }}>
                  <div className="label">Poora Naam</div>
                  <div className="inp-wrap"><span className="inp-icon">👤</span>
                    <input className={`inp ${errors.name ? "err" : ""}`} placeholder="Apna naam daalo" value={form.name} onChange={e => set("name", e.target.value)} /></div>
                  {errors.name && <div className="err-text">⚠ {errors.name}</div>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="label">Phone Number</div>
                  <div className="inp-wrap"><span className="inp-icon">📱</span>
                    <input className={`inp ${errors.phone ? "err" : ""}`} type="number" placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
                  {errors.phone && <div className="err-text">⚠ {errors.phone}</div>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="label">Email ID</div>
                  <div className="inp-wrap"><span className="inp-icon">✉️</span>
                    <input className={`inp ${errors.email ? "err" : ""}`} type="email" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                  {errors.email && <div className="err-text">⚠ {errors.email}</div>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="label">College ka Naam</div>
                  <div className="inp-wrap"><span className="inp-icon">🏫</span>
                    <input className={`inp ${errors.college ? "err" : ""}`} placeholder="e.g. Pune University, IIT Delhi" value={form.college} onChange={e => set("college", e.target.value)} /></div>
                  {errors.college && <div className="err-text">⚠ {errors.college}</div>}
                </div>
                <div style={{ marginBottom: 28 }}>
                  <div className="label">Year of Study</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
                    {["1st", "2nd", "3rd", "4th", "PG"].map(y => (
                      <button key={y} onClick={() => set("year", y)} style={{ background: form.year === y ? "linear-gradient(135deg,#4F9EFF,#00D9A6)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${form.year === y ? "transparent" : "rgba(79,158,255,0.15)"}`, borderRadius: 12, padding: "10px 6px", color: form.year === y ? "#fff" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "Outfit" }}>{y}</button>
                    ))}
                  </div>
                </div>
                <button className="btn-primary" onClick={handleRegisterNext} style={{ marginBottom: 20 }}>Aage Badhte Hain →</button>
                <div style={{ textAlign: "center", fontSize: 14, color: "#64748B", paddingBottom: 20 }}>
                  Pehle se account hai?{" "}
                  <span style={{ color: "#4F9EFF", fontWeight: 700, cursor: "pointer" }} onClick={() => setMode("login")}>Login karo</span>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="fade-up">
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(79,158,255,0.06)", border: "1px solid rgba(79,158,255,0.15)", borderRadius: 18, padding: "13px 16px", marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, fontFamily: "Outfit", fontWeight: 900, color: "#fff" }}>
                    {form.name ? form.name[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#F0F4FF" }}>{form.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{form.college} • {form.year} year</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 18 }}>✅</span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="label">Password banao</div>
                  <div className="inp-wrap"><span className="inp-icon">🔐</span>
                    <input className={`inp ${errors.password ? "err" : ""}`} type={showPass ? "text" : "password"} placeholder="6+ characters ka strong password" value={form.password} onChange={e => set("password", e.target.value)} />
                    <button className="inp-eye" onClick={() => setShowPass(v => !v)}>{showPass ? "🙈" : "👁️"}</button></div>
                  {errors.password && <div className="err-text">⚠ {errors.password}</div>}
                  {form.password.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length >= i*2 ? (form.password.length >= 8 ? "#00D9A6" : "#FFB800") : "rgba(255,255,255,0.07)", transition: "background 0.3s" }}/>
                      ))}
                      <span style={{ fontSize: 10, color: form.password.length >= 8 ? "#00D9A6" : "#FFB800", fontWeight: 600, marginLeft: 4, flexShrink: 0 }}>
                        {form.password.length >= 8 ? "Strong 💪" : "Weak 😬"}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="label">Confirm Password</div>
                  <div className="inp-wrap"><span className="inp-icon">🔑</span>
                    <input className={`inp ${errors.confirm ? "err" : ""}`} type="password" placeholder="Password dobara daalo" value={form.confirm} onChange={e => set("confirm", e.target.value)} />
                    {form.confirm && form.password === form.confirm && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>✅</span>}</div>
                  {errors.confirm && <div className="err-text">⚠ {errors.confirm}</div>}
                </div>

                {/* Keeper */}
                <div style={{ background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 18, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>🛡️</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#F0F4FF" }}>Keeper Setup</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#FF8C42", fontWeight: 600, background: "rgba(255,140,66,0.15)", padding: "2px 8px", borderRadius: 20 }}>Zaroori</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12, lineHeight: 1.6 }}>
                    Parent ka number daalo — locked categories mein spend karne pe unhe <strong>real WhatsApp alert</strong> jayega with Allow/Deny buttons 🔒
                  </div>
                  <div className="inp-wrap"><span className="inp-icon">👨‍👩‍👦</span>
                    <input className={`inp ${errors.parentPhone ? "err" : ""}`} type="number" placeholder="Parent ka 10-digit number" value={form.parentPhone} onChange={e => set("parentPhone", e.target.value)} /></div>
                  {errors.parentPhone && <div className="err-text">⚠ {errors.parentPhone}</div>}
                </div>

                {/* Budget */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div className="label" style={{ margin: 0 }}>Monthly Budget</div>
                    <span className="outfit" style={{ fontSize: 18, fontWeight: 800, color: "#4F9EFF" }}>₹{parseInt(form.monthlyBudget).toLocaleString()}</span>
                  </div>
                  <input type="range" className="range-input" min={1000} max={20000} step={500} value={form.monthlyBudget} onChange={e => set("monthlyBudget", e.target.value)}
                    style={{ background: `linear-gradient(to right, #4F9EFF ${(parseInt(form.monthlyBudget)-1000)/190}%, rgba(255,255,255,0.1) ${(parseInt(form.monthlyBudget)-1000)/190}%)` }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {[2000, 5000, 8000, 12000].map(v => (
                      <button key={v} onClick={() => set("monthlyBudget", String(v))} style={{ flex: 1, background: parseInt(form.monthlyBudget) === v ? "rgba(79,158,255,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${parseInt(form.monthlyBudget) === v ? "rgba(79,158,255,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "7px 4px", color: parseInt(form.monthlyBudget) === v ? "#4F9EFF" : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Outfit" }}>₹{v/1000}k</button>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" onClick={handleRegisterSubmit} disabled={loading} style={{ marginBottom: 16 }}>
                  {loading ? <span style={{ animation: "pulse 1s infinite" }}>Account ban raha hai…</span> : "Account Banao! 🎉"}
                </button>
                <div style={{ textAlign: "center", fontSize: 12, color: "#4A5568", paddingBottom: 20 }}>
                  Account bana ke tum agree karte ho hamari <span style={{ color: "#4F9EFF", cursor: "pointer" }}>Privacy Policy</span> se
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return null;
}
