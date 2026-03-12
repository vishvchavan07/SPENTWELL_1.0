import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, DEFAULT_DATA, T, css } from './theme';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import Expenses from './Expenses';
import Dues from './Dues';
import BubbleMap from './BubbleMap';
import Badges from './Badges';
import AIFeatures from './AIFeatures';

function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_DATA };
}

function saveData(d) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

const TABS = [
  { id: 'home',    label: 'Home',   icon: '📊' },
  { id: 'spend',   label: 'Spend',  icon: '💸' },
  { id: 'dues',    label: 'Dues',   icon: '🤝' },
  { id: 'map',     label: 'Map',    icon: '🫧' },
  { id: 'xp',      label: 'XP',     icon: '🏆' },
  { id: 'ai',      label: 'AI',     icon: '🤖' },
];

export default function App() {
  const [data, setDataRaw] = useState(loadData);
  const [tab, setTab] = useState('home');

  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  const handleOnboardComplete = (user) => {
    setData(prev => ({ ...prev, user, onboarded: true }));
  };

  if (!data.onboarded) {
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  // Overdue count for badge on Dues tab
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCnt = data.borrows.filter(b => !b.settled && b.dueDate && b.dueDate < todayStr).length;

  const appStyle = {
    background: T.bg,
    minHeight: '100dvh',
    color: T.text,
    fontFamily: "'Rajdhani', sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
  };

  const contentStyle = {
    padding: tab === 'map' ? 0 : '0 16px',
    paddingTop: tab === 'map' ? 0 : 56,
  };

  return (
    <div style={appStyle}>
      {/* Top Bar — hidden on Map */}
      {tab !== 'map' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          zIndex: 40,
          background: '#0a0a0aee',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e1e1e',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ ...css.orbitron, fontSize: 15, fontWeight: 900, color: T.neon, textShadow: '0 0 10px #39ff1466', letterSpacing: 2 }}>
            SPENTWELL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ ...css.orbitron, fontSize: 14, fontWeight: 700, color: T.yellow }}>{data.streak}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={contentStyle}>
        {tab === 'home'  && <Dashboard data={data} onNavigateDues={() => setTab('dues')} />}
        {tab === 'spend' && <Expenses data={data} setData={setData} />}
        {tab === 'dues'  && <Dues data={data} setData={setData} />}
        {tab === 'map'   && <BubbleMap data={data} setData={setData} />}
        {tab === 'xp'    && <Badges data={data} setData={setData} />}
        {tab === 'ai'    && <AIFeatures data={data} setData={setData} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 50,
        background: '#0f0f0fee',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #1e1e1e',
        display: 'flex',
        padding: '4px 0 8px',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const hasBadge = t.id === 'dues' && overdueCnt > 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                position: 'relative',
              }}
            >
              {/* Neon underline for active */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: T.neon,
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${T.neon}`,
                }} />
              )}
              {/* Red dot badge */}
              {hasBadge && (
                <div style={{
                  position: 'absolute',
                  top: 4,
                  right: '22%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: T.red,
                  boxShadow: `0 0 6px ${T.red}`,
                }} />
              )}
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{
                fontSize: 9,
                ...css.orbitron,
                color: active ? T.neon : T.muted,
                letterSpacing: 0.5,
                transition: 'color 0.2s',
              }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
