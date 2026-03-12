import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  CATEGORIES, getCatById, totalSpentThisMonth,
  daysLeftInMonth, formatDate, useTheme
} from './theme';

function BudgetBar({ spent, budget }) {
  const { T, css } = useTheme();
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const color = pct < 60 ? T.primary : pct < 85 ? T.yellow : T.danger;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ ...css.orbitron, fontSize: 11, color: T.mid }}>SPENT THIS MONTH</span>
        <span style={{ ...css.orbitron, fontSize: 11, color: T.mid }}>BUDGET</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ ...css.orbitron, fontSize: 28, fontWeight: 900, color }}>
          ₹{spent.toLocaleString()}
        </span>
        <span style={{ ...css.orbitron, fontSize: 18, color: T.mid }}>₹{budget.toLocaleString()}</span>
      </div>
      <div style={{ background: '#1a1a1a', borderRadius: 8, height: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          boxShadow: `0 0 10px ${color}99`,
          transition: 'width 0.5s ease, background 0.3s',
          borderRadius: 8,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 12, color: T.mid, ...css.rajdhani }}>{pct}% used</span>
        <span style={{ fontSize: 12, color: T.primary, ...css.rajdhani }}>
          Safe/day: ₹{Math.max(0, Math.round((budget - spent) / daysLeftInMonth()))}
        </span>
      </div>
      {pct > 85 && (
        <div style={{
          marginTop: 10, background: '#2a0010', border: `1px solid ${T.danger}`,
          borderRadius: 8, padding: '8px 12px', color: T.danger,
          fontSize: 12, ...css.rajdhani, fontWeight: 600,
        }}>
          ⚠️ Budget danger zone! {daysLeftInMonth()} days left
        </div>
      )}
    </div>
  );
}

function RecentActivity({ expenses }) {
  const { T, css } = useTheme();
  const last5 = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (!last5.length) return null;
  return (
    <div>
      <span style={css.sectionLabel}>RECENT ACTIVITY</span>
      {last5.map(e => {
        const cat = getCatById(e.category);
        return (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: '1px solid #1a1a1a',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: cat.color + '22', border: `1px solid ${cat.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>{cat.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontSize: 14, ...css.rajdhani, fontWeight: 600 }}>
                {e.note || cat.label}
              </div>
              <div style={{ color: T.muted, fontSize: 12 }}>{formatDate(e.date)}</div>
            </div>
            <div style={{ color: cat.color, ...css.orbitron, fontSize: 14, fontWeight: 700 }}>
              ₹{Number(e.amount).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  const { T, css } = useTheme();
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ color: T.mid, fontSize: 11, ...css.rajdhani }}>{label}</div>
      <div style={{ color: T.primary, fontWeight: 700, ...css.orbitron, fontSize: 13 }}>₹{payload[0].value}</div>
    </div>
  );
};

export default function Dashboard({ data, onNavigateDues }) {
  const { T, css } = useTheme();
  const { user, expenses, borrows, streak } = data;
  const spent = useMemo(() => totalSpentThisMonth(expenses), [expenses]);

  // Last 7 days data
  const last7 = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const total = expenses.filter(e => e.date === dStr).reduce((s, e) => s + Number(e.amount), 0);
      arr.push({ day: d.toLocaleDateString('en-IN', { weekday: 'short' }), amount: total });
    }
    return arr;
  }, [expenses]);

  // Category breakdown (this month)
  const catData = useMemo(() => {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    const map = {};
    expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; })
      .forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([cat, value]) => {
      const c = getCatById(cat);
      return { name: c.label, value, color: c.color };
    });
  }, [expenses]);

  // Dues summary
  const pending = borrows.filter(b => !b.settled);
  const toReceive = pending.filter(b => b.type === 'lent').reduce((s, b) => s + Number(b.amount), 0);
  const toGive = pending.filter(b => b.type === 'borrowed').reduce((s, b) => s + Number(b.amount), 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        ...css.darkCard, marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ color: T.muted, fontSize: 11, ...css.orbitron, letterSpacing: 2 }}>WELCOME BACK</div>
          <div style={{ ...css.orbitron, fontSize: 22, fontWeight: 900, color: T.primary, marginTop: 2 }}>
            {user.name.toUpperCase()}
          </div>
          <div style={{ color: T.mid, fontSize: 13, ...css.rajdhani, marginTop: 2 }}>{user.college}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22 }}>🔥</div>
          <div style={{ ...css.orbitron, fontSize: 18, fontWeight: 900, color: T.yellow }}>{streak}</div>
          <div style={{ color: T.muted, fontSize: 11, ...css.rajdhani }}>{dateStr}</div>
        </div>
      </div>

      {/* Budget Meter */}
      <div style={{ ...css.neonCard, marginBottom: 16 }}>
        <BudgetBar spent={spent} budget={user.budget} />
      </div>

      {/* Settle Up Summary */}
      {pending.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div
            onClick={onNavigateDues}
            style={{ ...css.darkCard, flex: 1, cursor: 'pointer', border: '1px solid #39ff1444', textAlign: 'center' }}
          >
            <div style={{ color: T.muted, fontSize: 10, ...css.orbitron, letterSpacing: 1 }}>RECEIVE KARNA HAI</div>
            <div style={{ color: T.primary, ...css.orbitron, fontSize: 18, fontWeight: 900, marginTop: 4 }}>₹{toReceive.toLocaleString()}</div>
          </div>
          <div
            onClick={onNavigateDues}
            style={{ ...css.darkCard, flex: 1, cursor: 'pointer', border: '1px solid #ff2d7844', textAlign: 'center' }}
          >
            <div style={{ color: T.muted, fontSize: 10, ...css.orbitron, letterSpacing: 1 }}>DENA HAI</div>
            <div style={{ color: T.danger, ...css.orbitron, fontSize: 18, fontWeight: 900, marginTop: 4 }}>₹{toGive.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ ...css.darkCard, marginBottom: 16 }}>
        <RecentActivity expenses={expenses} />
        {!expenses.length && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, ...css.rajdhani }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            No expenses yet — tap + ADD to get started
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={css.darkCard}>
        <span style={css.sectionLabel}>LAST 7 DAYS</span>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={last7} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: T.muted, fontSize: 10, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill={T.primary} radius={[4, 4, 0, 0]}>
              {last7.map((_, i) => (
                <Cell key={i} fill={T.primary} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {catData.length > 0 && (
          <>
            <span style={{ ...css.sectionLabel, marginTop: 16 }}>CATEGORY BREAKDOWN</span>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ color: T.text, fontSize: 13, ...css.rajdhani }}>{payload[0].name}: ₹{payload[0].value}</div>
                    </div>
                  );
                }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Rajdhani', color: T.mid }} />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
