import { useState } from 'react';
import { WEEKLY_CHALLENGES, totalSpentThisMonth, checkBadges, uid, useTheme } from './theme';

const BADGE_DEFS = [
  { id: 'first_log',   emoji: '🌱', name: 'First Step',     desc: 'Log your first expense' },
  { id: 'streak_3',    emoji: '🔥', name: 'On Fire',         desc: '3 day logging streak' },
  { id: 'streak_7',    emoji: '⚡', name: 'Weekly Warrior',  desc: '7 day streak' },
  { id: 'no_borrow',   emoji: '🤝', name: 'Clear Ledger',    desc: 'All dues settled' },
  { id: 'budget_king', emoji: '👑', name: 'Budget King',     desc: 'Under budget all month' },
  { id: 'roasted',     emoji: '🔥', name: 'Got Roasted',     desc: 'Used AI Spending Roast' },
];

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 6, height: 8, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, boxShadow: `0 0 8px ${color}88`, transition: 'width 0.5s' }} />
    </div>
  );
}

function GoalModal({ onClose, onAdd }) {
  const { T, css } = useTheme();
  const emojis = ['🎯', '💻', '✈️', '🏠', '🎸', '📱', '🎓', '🚗', '💍', '🌴'];
  const [emoji, setEmoji] = useState('🎯');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...css.darkCard, width: '90%', maxWidth: 360, animation: 'fadeUp 0.3s' }}>
        <span style={css.sectionLabel}>NEW SAVINGS JAR</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {emojis.map(em => (
            <button key={em} onClick={() => setEmoji(em)} style={{
              width: 40, height: 40, fontSize: 22, cursor: 'pointer', borderRadius: 8,
              background: emoji === em ? T.primaryDim : '#1a1a1a',
              border: `1.5px solid ${emoji === em ? T.primary : '#2a2a2a'}`,
            }}>{em}</button>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <input style={css.input} placeholder="Goal name (e.g. Laptop, Trip to Goa)" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input type="number" style={css.input} placeholder="₹ Target amount" value={target} onChange={e => setTarget(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ ...css.ghostBtn, flex: 1 }} onClick={onClose}>CANCEL</button>
          <button style={{ ...css.neonBtn, flex: 2, opacity: (!name || !target) ? 0.5 : 1 }}
            onClick={() => { if (name && target) { onAdd({ id: uid(), name, emoji, target: Number(target), saved: 0 }); onClose(); } }}
            disabled={!name || !target}>CREATE JAR</button>
        </div>
      </div>
    </div>
  );
}

export default function Badges({ data, setData }) {
  const { T, css } = useTheme();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const { user, expenses, borrows, streak, earnedBadges, savingsGoals } = data;
  const spent = totalSpentThisMonth(expenses);
  const pct = Math.min(100, Math.round((spent / user.budget) * 100));
  const pctColor = pct < 60 ? T.primary : pct < 85 ? T.yellow : T.danger;
  const settledCount = borrows.filter(b => b.settled).length;

  const motivations = [
    { min: 0, msg: 'Start your journey! Log today.' },
    { min: 1, msg: 'Keep going! 🔥' },
    { min: 3, msg: 'You\'re on fire! 🔥🔥' },
    { min: 7, msg: 'Weekly Warrior! Incredible! ⚡' },
    { min: 14, msg: 'Unstoppable! Legend status! 👑' },
    { min: 30, msg: 'One whole month?! 🏆 GOD MODE' },
  ];
  const motive = [...motivations].reverse().find(m => streak >= m.min);

  const challenge = WEEKLY_CHALLENGES[new Date().getDay() % WEEKLY_CHALLENGES.length];
  const daysLeft = 7 - (new Date().getDay() || 7);
  const challengeSpent = spent;
  const challengeTarget = user.budget * 0.7;

  const addGoal = (goal) => {
    setData(prev => ({ ...prev, savingsGoals: [...(prev.savingsGoals || []), goal] }));
  };

  const updateGoalSaved = (id, delta) => {
    setData(prev => ({
      ...prev,
      savingsGoals: (prev.savingsGoals || []).map(g => g.id === id ? { ...g, saved: Math.max(0, Math.min(g.target, g.saved + delta)) } : g),
    }));
  };

  const deleteGoal = (id) => {
    setData(prev => ({ ...prev, savingsGoals: (prev.savingsGoals || []).filter(g => g.id !== id) }));
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Streak Hero */}
      <div style={{ ...css.neonCard, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>🔥</div>
        <div style={{ ...css.orbitron, fontSize: 56, fontWeight: 900, color: T.yellow, lineHeight: 1 }}>{streak}</div>
        <div style={{ color: T.muted, ...css.orbitron, fontSize: 11, letterSpacing: 2, marginTop: 4 }}>DAY LOGGING STREAK</div>
        <div style={{ color: T.text, ...css.rajdhani, fontSize: 15, marginTop: 8, fontWeight: 600 }}>{motive?.msg}</div>
      </div>

      {/* Progress Bars */}
      <div style={{ ...css.darkCard, marginBottom: 16 }}>
        <span style={css.sectionLabel}>PROGRESS</span>
        {[
          { label: 'Monthly Budget Used', value: pct, max: 100, unit: '%', color: pctColor },
          { label: 'Streak', value: Math.min(streak, 7), max: 7, unit: ' days', color: T.yellow },
          { label: 'Dues Settled', value: settledCount, max: Math.max(borrows.length, 1), unit: `/${borrows.length}`, color: T.cyan },
        ].map(p => (
          <div key={p.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: T.mid, ...css.rajdhani, fontSize: 13 }}>{p.label}</span>
              <span style={{ color: p.color, ...css.orbitron, fontSize: 11 }}>{p.value}{p.unit}</span>
            </div>
            <ProgressBar value={p.value} max={p.max} color={p.color} />
          </div>
        ))}
      </div>

      {/* Badges Grid */}
      <div style={{ ...css.darkCard, marginBottom: 16 }}>
        <span style={css.sectionLabel}>BADGES</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {BADGE_DEFS.map(b => {
            const earned = earnedBadges.includes(b.id);
            return (
              <div key={b.id} style={{
                background: earned ? T.primaryDim : '#1a1a1a',
                border: `1.5px solid ${earned ? T.primary : '#2a2a2a'}`,
                borderRadius: 12, padding: 12, textAlign: 'center',
                opacity: earned ? 1 : 0.35,
                position: 'relative',
                transition: 'all 0.3s',
              }}>
                {earned && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6, width: 10, height: 10,
                    borderRadius: '50%', background: T.primary, boxShadow: `0 0 6px ${T.primary}`,
                  }} />
                )}
                <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                <div style={{ ...css.orbitron, fontSize: 10, color: earned ? T.primary : T.muted, fontWeight: 700 }}>{b.name}</div>
                <div style={{ color: T.muted, fontSize: 11, ...css.rajdhani, marginTop: 2 }}>{b.desc}</div>
                {earned && <div style={{ color: T.primary, fontSize: 10, ...css.orbitron, marginTop: 4 }}>EARNED ✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings Jars */}
      <div style={{ ...css.darkCard, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={css.sectionLabel}>SAVINGS JARS 🏺</span>
          <button style={{ ...css.ghostBtn, fontSize: 11, padding: '6px 12px' }} onClick={() => setShowGoalModal(true)}>+ ADD GOAL</button>
        </div>
        {!savingsGoals?.length ? (
          <div style={{ textAlign: 'center', color: T.muted, ...css.rajdhani, padding: '16px 0' }}>
            Set a savings goal — trip, laptop, anything!
          </div>
        ) : (
          savingsGoals.map(g => {
            const gPct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
            return (
              <div key={g.id} style={{ marginBottom: 14, padding: '10px', background: '#1a1a1a', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{g.emoji}</span>
                  <span style={{ ...css.rajdhani, fontWeight: 700, color: T.text, fontSize: 14, flex: 1, marginLeft: 8 }}>{g.name}</span>
                  <span style={{ color: T.primary, ...css.orbitron, fontSize: 12 }}>{gPct}%</span>
                  <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 14, marginLeft: 6 }}>✕</button>
                </div>
                <ProgressBar value={g.saved} max={g.target} color={T.primary} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ color: T.mid, fontSize: 12, ...css.rajdhani }}>₹{g.saved.toLocaleString()} / ₹{g.target.toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => updateGoalSaved(g.id, -100)} style={{ ...css.ghostBtn, fontSize: 11, padding: '4px 10px', borderColor: T.danger, color: T.danger }}>-₹100</button>
                    <button onClick={() => updateGoalSaved(g.id, 100)} style={{ ...css.ghostBtn, fontSize: 11, padding: '4px 10px' }}>+₹100</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Weekly Challenge */}
      <div style={{ ...css.darkCard, border: '1px solid #bf5af2', boxShadow: '0 0 16px #bf5af222' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ ...css.orbitron, fontSize: 11, color: T.purple, letterSpacing: 2 }}>⚡ WEEKLY CHALLENGE</span>
          <span style={{ color: T.muted, fontSize: 12, ...css.rajdhani }}>{daysLeft}d left</span>
        </div>
        <div style={{ color: T.text, ...css.rajdhani, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{challenge}</div>
        <ProgressBar value={Math.min(challengeSpent, challengeTarget)} max={challengeTarget} color={T.purple} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: T.muted, fontSize: 12 }}>₹{challengeSpent.toLocaleString()} spent</span>
          <span style={{ color: T.purple, fontSize: 12 }}>Target: ₹{challengeTarget.toLocaleString()}</span>
        </div>
      </div>

      {showGoalModal && <GoalModal onClose={() => setShowGoalModal(false)} onAdd={addGoal} />}
    </div>
  );
}
