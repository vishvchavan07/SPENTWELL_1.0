import { useState } from 'react';
import { totalSpentThisMonth, daysLeftInMonth, getCatById, uid, checkBadges, useTheme } from './theme';

let SARVAM_KEY = "";

async function askSarvam(systemPrompt, userPrompt, onChunk) {
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": SARVAM_KEY
    },
    body: JSON.stringify({
      model: "sarvam-m",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   }
      ],
      stream: true,
      max_tokens: 500
    })
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (raw === "[DONE]") break;
      try {
        const j = JSON.parse(raw);
        const t = j?.choices?.[0]?.delta?.content || "";
        if (t) { full += t; onChunk(full); }
      } catch(_) {}
    }
  }
  return full;
}

function tintCard(color, content, label, T, css) {
  return (
    <div style={{
      background: color + '15', border: `1px solid ${color}44`,
      borderRadius: 10, padding: 14, marginTop: 12, animation: 'fadeUp 0.3s',
    }}>
      {label && <div style={{ ...css.orbitron, fontSize: 10, color, letterSpacing: 2, marginBottom: 8 }}>{label}</div>}
      <div style={{ color: T.text, ...css.rajdhani, fontSize: 14, fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  );
}

export default function AIFeatures({ data, setData }) {
  const { T, css } = useTheme();
  const { user, expenses, borrows, streak, notifications, earnedBadges } = data;
  const spent = totalSpentThisMonth(expenses);
  const budget = user.budget;
  const pct = Math.round((spent / budget) * 100);
  const remaining = budget - spent;
  const daysLeft = daysLeftInMonth();
  const day = new Date().getDate();
  const dailyAvg = day > 0 ? Math.round(spent / day) : 0;
  const overdueDues = borrows.filter(b => !b.settled && b.dueDate && b.dueDate < new Date().toISOString().slice(0, 10)).length;

  // Top 3 categories
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
  const top3 = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([cat, amt]) => `${getCatById(cat).label} ₹${amt}`).join(', ');

  const [notifText, setNotifText] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [roastModal, setRoastModal] = useState(false);
  const [roastText, setRoastText] = useState('');
  const [roastLoading, setRoastLoading] = useState(false);
  const [jugaadText, setJugaadText] = useState('');
  const [jugaadLoading, setJugaadLoading] = useState(false);
  const [predictText, setPredictText] = useState('');
  const [predictLoading, setPredictLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const saveNotif = (text) => {
    const notif = { id: uid(), text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setData(prev => ({ ...prev, notifications: [notif, ...(prev.notifications || [])].slice(0, 5) }));
  };

  const handleDesiNotif = async () => {
    if (!SARVAM_KEY) {
      setNotifText("Bhai API key daalo pehle! dashboard.sarvam.ai pe jaao aur free key lo 🙏");
      return;
    }
    setNotifLoading(true); setNotifText('');
    const sysPrompt = "Tu ek desi Indian finance assistant hai jo college students ke liye kaam karta hai. Teri language Hinglish hai — Hindi aur English mix. Tu savage, funny, aur relatable hai. Short mein bolta hai.";
    const userPrompt = `Ek short notification likh — max 2 lines, funny aur savage Hinglish mein. Koi quote nahi, koi explanation nahi. Sirf notification.\nStudent: ${user.name}\nBudget: Rs.${budget}\nSpent: Rs.${spent} (${pct}% use ho gaya)\nOverdue dues: ${overdueDues} friends\nStreak: ${streak} days`;
    try {
      let txt = '';
      await askSarvam(sysPrompt, userPrompt, chunk => { txt = chunk; setNotifText(txt); });
      saveNotif(txt);
    } catch (e) { setNotifText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!"); }
    setNotifLoading(false);
  };

  const handleRoast = async () => {
    setRoastModal(true);
    if (!SARVAM_KEY) {
      setRoastText("Teri roast ke liye API key chahiye! Free mein milti hai dashboard.sarvam.ai pe 😄");
      return;
    }
    setRoastLoading(true); setRoastText('');
    const sysPrompt = "Tu ek savage desi financial roast comedian hai. Tu college students ka kharcha dekh ke unhe funny Hinglish mein roast karta hai. Desi references use kar — canteen, hostel, auto, chai, jugaad. Emoji use kar.";
    const userPrompt = `Is student ka poora mahine ka kharcha dekh aur 6-8 lines mein roast kar. Funny ho, desi references hon, aur end mein ek genuine money saving tip de.\nStudent: ${user.name}\nCollege: ${user.college}\nBudget: Rs.${budget}\nTotal spent: Rs.${spent}\nTop categories: ${top3 || 'N/A'}\nPending dues: ${borrows.filter(b => !b.settled).length} friends\nStreak: ${streak} days`;
    try {
      let txt = '';
      await askSarvam(sysPrompt, userPrompt, chunk => { txt = chunk; setRoastText(txt); });
      if (!earnedBadges.includes('roasted')) {
        setData(prev => {
          const newData = { ...prev, earnedBadges: [...prev.earnedBadges, 'roasted'] };
          return { ...newData, earnedBadges: checkBadges(newData) };
        });
      }
    } catch (e) { setRoastText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!"); }
    setRoastLoading(false);
  };

  const handleJugaad = async () => {
    if (!SARVAM_KEY) {
      setJugaadText("API key nahi hai toh jugaad bhi nahi hoga bhai 😅");
      return;
    }
    setJugaadLoading(true); setJugaadText('');
    const sysPrompt = "Tu ek jugaadu desi financial advisor hai jo broke college students ko paise bachane ke tips deta hai. Teri tips practical, funny, aur desi hoti hain.";
    const userPrompt = `4 desi money saving tips de is student ke liye.\nHinglish mein. Har tip max 1 line. 1-2-3-4 numbered.\nFunny but practical.\nRemaining budget: Rs.${remaining}\nDays left in month: ${daysLeft}\nCollege: ${user.college}`;
    try {
      await askSarvam(sysPrompt, userPrompt, chunk => { setJugaadText(chunk); });
    } catch (e) { setJugaadText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!"); }
    setJugaadLoading(false);
  };

  const handlePredict = async () => {
    if (!SARVAM_KEY) {
      setPredictText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!");
      return;
    }
    setPredictLoading(true); setPredictText('');
    const sysPrompt = "Tu ek data-driven desi finance predictor hai. Tu student ka spending pattern dekh ke predict karta hai kab unka budget khatam hoga. Hinglish mein, specific dates ke saath.";
    const userPrompt = `Is student ka spending pattern dekh ke 2 lines mein predict kar kab budget khatam hoga. Hinglish mein. Specific date bata.\nBudget: Rs.${budget}\nSpent so far: Rs.${spent}\nDay of month: ${day} out of 30\nDaily average spend: Rs.${dailyAvg}`;
    try {
      await askSarvam(sysPrompt, userPrompt, chunk => { setPredictText(chunk); });
    } catch (e) { setPredictText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!"); }
    setPredictLoading(false);
  };

  const handleReport = async () => {
    if (!SARVAM_KEY) {
      setReportText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!");
      return;
    }
    setReportLoading(true); setReportText('');
    const saved = Math.max(0, budget - spent);
    const clearedDues = borrows.filter(b => b.settled).length;
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCategoryLabel = topCat ? getCatById(topCat[0]).label : 'N/A';
    
    const sysPrompt = "Tu ek funny desi school teacher hai jo college students ko unke monthly finance ka report card deta hai. Tu grades deta hai aur funny feedback likhta hai Hinglish mein.";
    const userPrompt = `Is student ko ek funny monthly finance report card de. Ek letter grade (A to F), ek funny title jaise 'Budget King' ya 'Canteen ka CEO', aur 3 bullet points feedback. Fun aur desi rakho.\nBudget: Rs.${budget}\nTotal spent: Rs.${spent}\nTop spending category: ${topCategoryLabel}\nAmount saved: Rs.${saved}\nDues cleared: ${clearedDues}`;
    try {
      await askSarvam(sysPrompt, userPrompt, chunk => { setReportText(chunk); });
    } catch (e) { setReportText("Sarvam AI se connect nahi hua. Key check karo aur dobara try karo!"); }
    setReportLoading(false);
  };

  const AIBtn = ({ onClick, loading, label, color, disabled }) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${color || T.primary}`,
        background: `${color || T.primary}15`,
        color: color || T.primary,
        fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 12,
        letterSpacing: 1, transition: 'opacity 0.2s',
        opacity: loading || disabled ? 0.6 : 1,
        marginBottom: 10,
        textAlign: 'left',
      }}
    >
      {loading ? '⏳ AI soch raha hai...' : label}
    </button>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <span style={{ ...css.orbitron, fontSize: 20, fontWeight: 900, color: T.text, display: 'block', marginBottom: 4 }}>🤖 AI FEATURES</span>
      <div style={{ color: '#FF9933', ...css.rajdhani, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Powered by Sarvam AI 🇮🇳</div>

      <div style={{ marginBottom: 20, padding: 12, background: '#111', borderRadius: 10, border: '1px solid #333' }}>
        <label style={{ display: 'block', ...css.orbitron, fontSize: 10, color: T.muted, marginBottom: 6, letterSpacing: 1 }}>SARVAM API KEY</label>
        <input 
          type="password" 
          placeholder="sk_sarvam_xxxxxxxxx"
          onChange={(e) => { SARVAM_KEY = e.target.value; }}
          style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #444', background: '#000', color: T.text, fontFamily: 'monospace', fontSize: 12 }}
        />
        <div style={{ color: T.muted, fontSize: 10, marginTop: 6, fontFamily: 'sans-serif' }}>Get free key at <a href="https://dashboard.sarvam.ai" target="_blank" rel="noreferrer" style={{color: '#FF9933', textDecoration: 'none'}}>dashboard.sarvam.ai</a></div>
      </div>

      {/* FEATURE 1 — Desi Notification */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>DESI NOTIFICATION</span>
        <AIBtn onClick={handleDesiNotif} loading={notifLoading} label="🔔 Get Desi Notification" color={T.yellow} />
        {notifText && tintCard(T.yellow, notifText, '📢 NOTIFICATION', T, css)}
        {notifications?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: T.muted, fontSize: 11, ...css.orbitron, letterSpacing: 1, marginBottom: 6 }}>HISTORY</div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: '8px 10px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ color: T.text, ...css.rajdhani, fontSize: 13 }}>{n.text}</div>
                <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FEATURE 2 — Roast */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>AI SPENDING ROAST</span>
        <AIBtn onClick={handleRoast} loading={roastLoading} label="🔥 ROAST MY SPENDING" color={T.danger} />
      </div>

      {/* FEATURE 3 — Jugaad */}
      {pct >= 70 && (
        <div style={{ ...css.darkCard, marginBottom: 14 }}>
          <span style={css.sectionLabel}>JUGAAD MODE</span>
          <AIBtn onClick={handleJugaad} loading={jugaadLoading} label="🔧 Jugaad Mode Tips" color={T.primary} />
          {jugaadText && tintCard(T.primary, jugaadText, '💡 TIPS', T, css)}
        </div>
      )}

      {/* FEATURE 4 — Predict */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>EXPENSE PREDICTION</span>
        <AIBtn onClick={handlePredict} loading={predictLoading} label="🔮 Predict My Month" color={T.purple} />
        {predictText && tintCard(T.purple, predictText, '🔮 PREDICTION', T, css)}
      </div>

      {/* FEATURE 5 — Report Card */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>MONTH-END REPORT CARD</span>
        <AIBtn onClick={handleReport} loading={reportLoading} label="📋 Generate Report Card" color={T.cyan} />
        {reportText && (
          <div style={{
            background: '#0a1a20', border: `1px solid ${T.cyan}44`, borderRadius: 10,
            padding: 14, marginTop: 12, fontFamily: "'Courier New', monospace",
            animation: 'fadeUp 0.3s',
          }}>
            <div style={{ color: T.cyan, fontSize: 12, letterSpacing: 2, marginBottom: 8, fontFamily: "'Orbitron', monospace" }}>📋 REPORT CARD</div>
            <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reportText}</div>
          </div>
        )}
      </div>

      {/* Roast Modal */}
      {roastModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#1a000acc', zIndex: 300,
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.3s',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
            <div style={{ ...css.orbitron, fontSize: 20, fontWeight: 900, color: T.danger, marginBottom: 16, textShadow: `0 0 20px ${T.danger}` }}>
              🔥 YOUR SPENDING ROAST
            </div>
            {roastLoading && <div style={{ color: T.muted, ...css.rajdhani, fontSize: 14 }}>⏳ AI soch raha hai...</div>}
            <div style={{
              color: T.text, ...css.rajdhani, fontSize: 15, lineHeight: 1.8,
              whiteSpace: 'pre-wrap', background: '#200005', borderRadius: 12,
              padding: 16, border: `1px solid ${T.danger}44`,
            }}>{roastText}</div>
          </div>
          <div style={{ padding: 20 }}>
            <button
              onClick={() => setRoastModal(false)}
              style={{ ...css.neonBtn, width: '100%', background: T.danger, fontSize: 14, padding: 14 }}
            >OUCH, GOT IT 😅</button>
          </div>
        </div>
      )}
    </div>
  );
}
