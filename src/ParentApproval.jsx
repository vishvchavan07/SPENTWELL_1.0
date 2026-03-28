import { useState } from "react";

// ── Helpers ─────────────────────────────────────────────────
const cleanPhone = (p = "") => {
  const d = p.toString().replace(/\D/g, "");
  if (d.startsWith("91") && d.length === 12) return d;
  if (d.length === 10) return "91" + d;
  return d;
};

const CATEGORY_META = {
  food: { icon: "🍕", color: "#FF6B6B" },
  transport: { icon: "🚗", color: "#4F9EFF" },
  study: { icon: "📚", color: "#A78BFA" },
  entertainment: { icon: "🎮", color: "#00D9A6" },
  health: { icon: "💊", color: "#FF8C42" },
  shopping: { icon: "🛍️", color: "#FFB800" },
  other: { icon: "💸", color: "#64748B" },
};

export default function ParentApproval({ data }) {
  const [decision, setDecision] = useState(null); // null | "allowed" | "denied"

  if (!data) return null;

  const { studentName, category, amount, note, code, studentPhone } = data;
  const meta = CATEGORY_META[category] || CATEGORY_META.other;

  const handleAllow = () => {
    setDecision("allowed");
    // Send the approval code back to student via WhatsApp
    if (studentPhone) {
      const msg = `✅ SpentWell Approval\n\nMain ${studentName} ka ₹${amount} (${category}) spend allow kar raha/rahi hoon.\n\n🔑 Approval Code: *${code}*\n\nYe code apne app mein daalo to proceed karo.`;
      window.open(`https://wa.me/${cleanPhone(studentPhone)}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleDeny = () => {
    setDecision("denied");
    if (studentPhone) {
      const msg = `❌ SpentWell Request Denied\n\n${studentName} ka ₹${amount} (${category}) ka request deny kar diya gaya hai.\n\nPlease apne parents se baat karo. 🙏`;
      window.open(`https://wa.me/${cleanPhone(studentPhone)}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{background:#070B14;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes checkPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
    @keyframes crossPop{0%{transform:scale(0) rotate(-30deg);opacity:0}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
    @keyframes orb{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-15px)}}
    .pa-root{background:#070B14;color:#F0F4FF;min-height:100vh;max-width:430px;margin:0 auto;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;position:relative;overflow:hidden;}
    .outfit{font-family:'Outfit',sans-serif;}
    .btn{border:none;border-radius:18px;padding:17px;font-size:16px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;width:100%;transition:all 0.22s;letter-spacing:0.3px;}
    .btn:hover{transform:translateY(-2px);}
    .btn:active{transform:scale(0.97);}
    .allow-btn{background:linear-gradient(135deg,#00D9A6,#00b388);color:#fff;box-shadow:0 8px 24px rgba(0,217,166,0.4);}
    .allow-btn:hover{box-shadow:0 12px 32px rgba(0,217,166,0.55);}
    .deny-btn{background:rgba(255,107,107,0.12);border:1.5px solid rgba(255,107,107,0.35)!important;color:#FF6B6B;}
    .deny-btn:hover{background:rgba(255,107,107,0.2);}
    .code-box{background:rgba(79,158,255,0.08);border:2px solid rgba(79,158,255,0.3);border-radius:20px;padding:20px;text-align:center;margin-bottom:20px;}
    .code-digits{font-family:'Outfit',sans-serif;font-size:40px;font-weight:900;letter-spacing:10px;color:#4F9EFF;margin:8px 0;}
    .wa-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#25D366,#128C7E);border:none;border-radius:16px;padding:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all 0.22s;font-family:'Outfit',sans-serif;margin-top:12px;}
    .wa-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,0.45);}
  `;

  // ── Request card (before decision) ────────────────────────
  if (!decision) return (
    <>
      <style>{css}</style>
      <div className="pa-root">
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(79,158,255,0.08)", filter: "blur(70px)", animation: "orb 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,217,166,0.07)", filter: "blur(60px)" }} />

        <div style={{ width: "100%", maxWidth: 390, animation: "fadeUp 0.4s ease" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💸</div>
              <span className="outfit" style={{ fontSize: 20, fontWeight: 800 }}>Spent<span style={{ color: "#4F9EFF" }}>Well</span></span>
            </div>
            <div style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.3)", borderRadius: 20, display: "inline-block", padding: "5px 14px", marginBottom: 18 }}>
              <span style={{ fontSize: 12, color: "#FFB800", fontWeight: 700 }}>🛡️ KEEPER APPROVAL REQUEST</span>
            </div>
            <div className="outfit" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 6 }}>
              Aapke ward ne<br />kharch ki permission maangi hai
            </div>
            <div style={{ fontSize: 14, color: "#64748B" }}>Please review karein aur Allow ya Deny karein</div>
          </div>

          {/* Student + Category card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 20, marginBottom: 18 }}>
            {/* Student */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#4F9EFF,#00D9A6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "Outfit", flexShrink: 0 }}>
                {studentName?.[0]?.toUpperCase() || "S"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#F0F4FF" }}>{studentName}</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>SpentWell Student Account</div>
              </div>
            </div>

            {/* Request details */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${meta.color}18`, border: `1.5px solid ${meta.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 3 }}>Spend Request</div>
                <div className="outfit" style={{ fontSize: 32, fontWeight: 900, color: meta.color, lineHeight: 1 }}>₹{parseFloat(amount).toLocaleString()}</div>
                <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Category: <strong style={{ color: "#F0F4FF" }}>{category.charAt(0).toUpperCase() + category.slice(1)}</strong></div>
              </div>
            </div>

            {note && note !== "No description" && (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "11px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📝</span>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 2 }}>NOTE</div>
                  <div style={{ fontSize: 14, color: "#CBD5E1" }}>{note}</div>
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <div style={{ background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: 16, padding: "12px 16px", marginBottom: 22, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6 }}>
              Aapne is category ko <strong>Keeper Lock</strong> mein rakha hai. {studentName} bina aapki permission ke yahan spend nahi kar sakta/sakti.
            </div>
          </div>

          {/* ALLOW button */}
          <button className="btn allow-btn" onClick={handleAllow} style={{ marginBottom: 12 }}>
            ✅ Allow Karo — Spend Karne Do
          </button>

          {/* DENY button */}
          <button className="btn deny-btn" onClick={handleDeny} style={{ border: "none" }}>
            ❌ Deny Karo — Permission Nahi
          </button>

          <div style={{ textAlign: "center", fontSize: 12, color: "#4A5568", marginTop: 20 }}>
            SpentWell Keeper System • Student Financial Accountability
          </div>
        </div>
      </div>
    </>
  );

  // ── ALLOWED ──────────────────────────────────────────────
  if (decision === "allowed") return (
    <>
      <style>{css}</style>
      <div className="pa-root">
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(0,217,166,0.1)", filter: "blur(70px)" }} />
        <div style={{ width: "100%", maxWidth: 390, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
          <div style={{ animation: "checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards", display: "inline-block", marginBottom: 24 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#00D9A6,#00b388)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 16px 40px rgba(0,217,166,0.45)", margin: "0 auto" }}>✓</div>
          </div>

          <div className="outfit" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Permission Di Gai! 🎉</div>
          <div style={{ fontSize: 14, color: "#64748B", marginBottom: 28, lineHeight: 1.7 }}>
            Aapne {studentName} ko ₹{parseFloat(amount).toLocaleString()} ({category}) spend karne ki permission di hai.
          </div>

          {/* Approval Code Box */}
          <div className="code-box">
            <div style={{ fontSize: 12, color: "#4F9EFF", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>🔑 Approval Code — {studentName} ko bhejo</div>
            <div className="code-digits">{code}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Ye code apne app mein enter karna hoga student ko</div>
          </div>

          {studentPhone ? (
            <button className="wa-btn" onClick={() => {
              const msg = `✅ SpentWell Approval\n\nMain ${studentName} ka ₹${amount} (${category}) spend allow kar raha/rahi hoon.\n\n🔑 Approval Code: *${code}*\n\nYe code apne app mein daalo to proceed karo.`;
              window.open(`https://wa.me/${cleanPhone(studentPhone)}?text=${encodeURIComponent(msg)}`, "_blank");
            }}>
              <span style={{ fontSize: 22 }}>💬</span>
              Code {studentName} ko WhatsApp Karo
            </button>
          ) : (
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Upar wala code {studentName} ko manually share karo.</div>
          )}

          <div style={{ fontSize: 12, color: "#4A5568", marginTop: 24 }}>SpentWell Keeper System</div>
        </div>
      </div>
    </>
  );

  // ── DENIED ───────────────────────────────────────────────
  if (decision === "denied") return (
    <>
      <style>{css}</style>
      <div className="pa-root">
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,107,107,0.08)", filter: "blur(70px)" }} />
        <div style={{ width: "100%", maxWidth: 390, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
          <div style={{ animation: "crossPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards", display: "inline-block", marginBottom: 24 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B6B,#FF4040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 16px 40px rgba(255,107,107,0.4)", margin: "0 auto" }}>✕</div>
          </div>

          <div className="outfit" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Request Deny Ki Gai</div>
          <div style={{ fontSize: 14, color: "#64748B", marginBottom: 28, lineHeight: 1.7 }}>
            {studentName} ko ₹{parseFloat(amount).toLocaleString()} ({category}) spend karne ki permission nahi di gayi.
          </div>

          <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 18, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7 }}>
              {studentName} ko aapka WhatsApp message gaya hoga. Agar zaroorat hai toh unse baat karein. 🙏
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#4A5568" }}>SpentWell Keeper System</div>
        </div>
      </div>
    </>
  );

  return null;
}
