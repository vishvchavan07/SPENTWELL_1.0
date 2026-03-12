import { useState } from 'react';
import { css, T, totalSpentThisMonth, daysLeftInMonth, getCatById, uid, checkBadges } from './theme';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function streamClaude(prompt, onChunk) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error: ${res.status} - ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try {
        const json = JSON.parse(raw);
        const delta = json?.delta?.text;
        if (delta) onChunk(delta);
      } catch { /* skip */ }
    }
  }
}

function tintCard(color, content, label) {
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
    setNotifLoading(true); setNotifText('');
    const prompt = `Generate ONE short savage funny Hinglish notification for a college student finance app. Max 2 lines. No quotes. No explanation. Just the notification.\nStudent: ${user.name}, Budget: ₹${budget}, Spent: ₹${spent} (${pct}% used), Overdue dues: ${overdueDues}, Streak: ${streak} days`;
    try {
      let txt = '';
      await streamClaude(prompt, chunk => { txt += chunk; setNotifText(txt); });
      saveNotif(txt);
    } catch (e) { setNotifText('❌ API Error: ' + e.message); }
    setNotifLoading(false);
  };

  const handleRoast = async () => {
    setRoastModal(true); setRoastLoading(true); setRoastText('');
    const prompt = `You are a savage but funny desi financial advisor roasting a college student in Hinglish. Roast their monthly spending in 6-8 lines. Be funny, use desi references, college life references. Use emoji. End with 1 genuine tip.\nStudent: ${user.name}, College: ${user.college}, Budget: ₹${budget}, Spent: ₹${spent}, Top categories: ${top3 || 'N/A'}, Pending dues: ${borrows.filter(b => !b.settled).length} friends, Streak: ${streak} days. Write roast directly. No intro.`;
    try {
      let txt = '';
      await streamClaude(prompt, chunk => { txt += chunk; setRoastText(txt); });
      if (!earnedBadges.includes('roasted')) {
        setData(prev => {
          const newData = { ...prev, earnedBadges: [...prev.earnedBadges, 'roasted'] };
          return { ...newData, earnedBadges: checkBadges(newData) };
        });
      }
    } catch (e) { setRoastText('❌ API Error: ' + e.message); }
    setRoastLoading(false);
  };

  const handleJugaad = async () => {
    setJugaadLoading(true); setJugaadText('');
    const prompt = `Give 4 desi money saving tips for a broke college student in Hinglish. Each tip max 1 line. Numbered 1-4. Funny but practical.\nThey have ₹${remaining} left for ${daysLeft} days.`;
    try {
      let txt = '';
      await streamClaude(prompt, chunk => { txt += chunk; setJugaadText(txt); });
    } catch (e) { setJugaadText('❌ API Error: ' + e.message); }
    setJugaadLoading(false);
  };

  const handlePredict = async () => {
    setPredictLoading(true); setPredictText('');
    const prompt = `Based on this student's spending pattern, predict when they will run out of budget. Give a 2-line prediction in Hinglish. Be specific with dates.\nBudget: ₹${budget}, Spent so far: ₹${spent}, Day of month: ${day}/30, Daily average: ₹${dailyAvg}`;
    try {
      let txt = '';
      await streamClaude(prompt, chunk => { txt += chunk; setPredictText(txt); });
    } catch (e) { setPredictText('❌ API Error: ' + e.message); }
    setPredictLoading(false);
  };

  const handleReport = async () => {
    setReportLoading(true); setReportText('');
    const saved = Math.max(0, budget - spent);
    const clearedDues = borrows.filter(b => b.settled).length;
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const prompt = `Generate a funny student-style monthly finance report card in Hinglish. Give them a letter grade (A to F) and a funny title like 'Budget King' or 'Canteen ka Shareholder'. Then 3 bullet points of feedback. Keep it fun.\nBudget: ₹${budget}, Spent: ₹${spent}, Top spend: ${topCat ? getCatById(topCat[0]).label : 'N/A'}, Savings: ₹${saved}, Dues cleared: ${clearedDues}`;
    try {
      let txt = '';
      await streamClaude(prompt, chunk => { txt += chunk; setReportText(txt); });
    } catch (e) { setReportText('❌ API Error: ' + e.message); }
    setReportLoading(false);
  };

  const AIBtn = ({ onClick, loading, label, color, disabled }) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
        border: `1px solid ${color || T.neon}`,
        background: `${color || T.neon}15`,
        color: color || T.neon,
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
      <div style={{ color: T.muted, ...css.rajdhani, fontSize: 13, marginBottom: 20 }}>Powered by Claude AI — Hinglish mein samjhega!</div>

      {/* FEATURE 1 — Desi Notification */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>DESI NOTIFICATION</span>
        <AIBtn onClick={handleDesiNotif} loading={notifLoading} label="🔔 Get Desi Notification" color={T.yellow} />
        {notifText && tintCard(T.yellow, notifText, '📢 NOTIFICATION')}
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
        <AIBtn onClick={handleRoast} loading={roastLoading} label="🔥 ROAST MY SPENDING" color={T.red} />
      </div>

      {/* FEATURE 3 — Jugaad */}
      {pct >= 70 && (
        <div style={{ ...css.darkCard, marginBottom: 14 }}>
          <span style={css.sectionLabel}>JUGAAD MODE</span>
          <AIBtn onClick={handleJugaad} loading={jugaadLoading} label="🔧 Jugaad Mode Tips" color={T.neon} />
          {jugaadText && tintCard(T.neon, jugaadText, '💡 TIPS')}
        </div>
      )}

      {/* FEATURE 4 — Predict */}
      <div style={{ ...css.darkCard, marginBottom: 14 }}>
        <span style={css.sectionLabel}>EXPENSE PREDICTION</span>
        <AIBtn onClick={handlePredict} loading={predictLoading} label="🔮 Predict My Month" color={T.purple} />
        {predictText && tintCard(T.purple, predictText, '🔮 PREDICTION')}
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
            <div style={{ ...css.orbitron, fontSize: 20, fontWeight: 900, color: T.red, marginBottom: 16, textShadow: `0 0 20px ${T.red}` }}>
              🔥 YOUR SPENDING ROAST
            </div>
            {roastLoading && <div style={{ color: T.muted, ...css.rajdhani, fontSize: 14 }}>⏳ AI soch raha hai...</div>}
            <div style={{
              color: T.text, ...css.rajdhani, fontSize: 15, lineHeight: 1.8,
              whiteSpace: 'pre-wrap', background: '#200005', borderRadius: 12,
              padding: 16, border: `1px solid ${T.red}44`,
            }}>{roastText}</div>
          </div>
          <div style={{ padding: 20 }}>
            <button
              onClick={() => setRoastModal(false)}
              style={{ ...css.neonBtn, width: '100%', background: T.red, fontSize: 14, padding: 14 }}
            >OUCH, GOT IT 😅</button>
          </div>
        </div>
      )}
    </div>
  );
}
