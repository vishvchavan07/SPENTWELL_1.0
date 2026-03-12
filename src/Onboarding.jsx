import { useState } from 'react';
import { useTheme } from './theme';

export default function Onboarding({ onComplete }) {
  const { T, css } = useTheme();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('Student');
  const [college, setCollege] = useState('');
  const [budget, setBudget] = useState(7500);
  const [customBudget, setCustomBudget] = useState('');

  const chips = [3000, 5000, 7500, 10000, 15000];
  const occs = [
    { label: 'Student', emoji: '🎓' },
    { label: 'Working Pro', emoji: '💼' },
    { label: 'Freelancer', emoji: '🧑‍💻' },
  ];

  const handleFinish = () => {
    const finalBudget = customBudget ? Number(customBudget) : budget;
    onComplete({ name: name || 'User', occupation, college: college || 'Your College', budget: finalBudget });
  };

  const containerStyle = {
    minHeight: '100dvh',
    background: T.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 20px',
    fontFamily: "'Rajdhani', sans-serif",
    color: T.text,
  };

  return (
    <div style={containerStyle}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          ...css.orbitron,
          fontSize: 36,
          fontWeight: 900,
          color: T.primary,
          textShadow: '0 0 20px #39ff14, 0 0 40px #39ff1466',
          letterSpacing: 4,
        }}>SPENTWELL</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 6, letterSpacing: 3, ...css.orbitron }}>STUDENT FINANCE OS</div>
      </div>

      {step === 1 && (
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ ...css.neonCard, marginBottom: 20 }}>
            <span style={css.sectionLabel}>YOUR NAME</span>
            <input
              style={css.input}
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ ...css.darkCard, marginBottom: 24 }}>
            <span style={css.sectionLabel}>I AM A...</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {occs.map(o => (
                <button
                  key={o.label}
                  onClick={() => setOccupation(o.label)}
                  style={{
                    flex: 1,
                    background: occupation === o.label ? T.primaryDim : '#1a1a1a',
                    border: `2px solid ${occupation === o.label ? T.primary : '#2a2a2a'}`,
                    borderRadius: 10,
                    padding: '14px 8px',
                    cursor: 'pointer',
                    color: occupation === o.label ? T.primary : T.mid,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: occupation === o.label ? '0 0 12px #39ff1433' : 'none',
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{o.emoji}</div>
                  <div>{o.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            style={{ ...css.neonBtn, width: '100%', padding: '14px', fontSize: 14 }}
            onClick={() => setStep(2)}
            disabled={!name.trim()}
          >
            NEXT →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ ...css.darkCard, marginBottom: 16 }}>
            <span style={css.sectionLabel}>COLLEGE / INSTITUTE</span>
            <input
              style={css.input}
              placeholder="Your college name"
              value={college}
              onChange={e => setCollege(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ ...css.darkCard, marginBottom: 24 }}>
            <span style={css.sectionLabel}>MONTHLY BUDGET</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {chips.map(c => (
                <button
                  key={c}
                  onClick={() => { setBudget(c); setCustomBudget(''); }}
                  style={{
                    background: budget === c && !customBudget ? T.primaryDim : '#1a1a1a',
                    border: `1px solid ${budget === c && !customBudget ? T.primary : '#333'}`,
                    borderRadius: 20,
                    padding: '6px 14px',
                    color: budget === c && !customBudget ? T.primary : T.mid,
                    cursor: 'pointer',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s',
                  }}
                >₹{c.toLocaleString()}</button>
              ))}
            </div>
            <input
              style={css.input}
              type="number"
              placeholder="Or enter custom amount"
              value={customBudget}
              onChange={e => setCustomBudget(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{ ...css.ghostBtn, flex: 1, padding: '14px' }}
              onClick={() => setStep(1)}
            >← BACK</button>
            <button
              style={{ ...css.neonBtn, flex: 2, padding: '14px', fontSize: 14 }}
              onClick={handleFinish}
            >LET'S GO 🚀</button>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
        {[1, 2].map(s => (
          <div key={s} style={{
            width: s === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: s === step ? T.primary : T.muted,
            transition: 'all 0.3s',
            boxShadow: s === step ? '0 0 8px #39ff14' : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}
