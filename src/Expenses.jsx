import { useState, useMemo } from 'react';
import { CATEGORIES, getCatById, formatDate, uid, updateStreak, checkBadges, useTheme } from './theme';

function AddModal({ onClose, onAdd }) {
  const { T, css } = useTheme();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = () => {
    if (!amount || !Number(amount)) return;
    onAdd({ id: uid(), amount: Number(amount), category, note, date });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#111', borderRadius: '20px 20px 0 0',
        padding: 20, animation: 'slideUp 0.3s ease',
        border: '1px solid #1e1e1e', borderBottom: 'none',
        maxHeight: '92dvh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
        <span style={css.sectionLabel}>LOG EXPENSE</span>

        {/* Amount */}
        <div style={{ marginBottom: 16 }}>
          <input
            autoFocus
            type="number"
            placeholder="₹ Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ ...css.input, fontSize: 28, fontFamily: "'Orbitron', monospace", textAlign: 'center', color: T.primary }}
          />
        </div>

        {/* Category Grid */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: T.muted, fontSize: 11, ...css.rajdhani, marginBottom: 8 }}>CATEGORY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  background: category === cat.id ? cat.color + '22' : '#1a1a1a',
                  border: `1.5px solid ${category === cat.id ? cat.color : '#2a2a2a'}`,
                  borderRadius: 10,
                  padding: '10px 4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20 }}>{cat.emoji}</div>
                <div style={{ color: category === cat.id ? cat.color : T.muted, fontSize: 10, ...css.rajdhani, fontWeight: 600, marginTop: 3 }}>
                  {cat.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 12 }}>
          <input
            style={css.input}
            placeholder="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="date"
            style={css.input}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ ...css.ghostBtn, flex: 1 }} onClick={onClose}>CANCEL</button>
          <button
            style={{ ...css.neonBtn, flex: 2, opacity: !amount ? 0.5 : 1 }}
            onClick={handleSubmit}
            disabled={!amount}
          >LOG IT ✓</button>
        </div>
      </div>
    </div>
  );
}

export default function Expenses({ data, setData }) {
  const { T, css } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const filtered = useMemo(() => {
    const sorted = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterCat === 'all') return sorted;
    return sorted.filter(e => e.category === filterCat);
  }, [data.expenses, filterCat]);

  const handleAdd = (expense) => {
    const streakData = updateStreak(data);
    const newExpenses = [expense, ...data.expenses];
    const newData = { ...data, expenses: newExpenses, ...streakData };
    newData.earnedBadges = checkBadges(newData);
    setData(newData);
  };

  const handleDelete = (id) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ ...css.orbitron, fontSize: 20, fontWeight: 900, color: T.text }}>EXPENSES</span>
        <button style={css.neonBtn} onClick={() => setShowModal(true)}>+ ADD</button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {['all', ...CATEGORIES.map(c => c.id)].map(id => {
          const cat = id === 'all' ? null : getCatById(id);
          const active = filterCat === id;
          return (
            <button
              key={id}
              onClick={() => setFilterCat(id)}
              style={{
                background: active ? (cat ? cat.color + '22' : T.primaryDim) : '#1a1a1a',
                border: `1.5px solid ${active ? (cat ? cat.color : T.primary) : '#2a2a2a'}`,
                borderRadius: 20,
                padding: '6px 14px',
                cursor: 'pointer',
                color: active ? (cat ? cat.color : T.primary) : T.muted,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {id === 'all' ? 'All' : `${cat.emoji} ${cat.label}`}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted, ...css.rajdhani }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div>No expenses yet — tap + ADD</div>
        </div>
      ) : (
        filtered.map(e => {
          const cat = getCatById(e.category);
          return (
            <div key={e.id} style={{
              ...css.darkCard,
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 8, padding: '12px 14px',
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: cat.color + '22', border: `1px solid ${cat.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{cat.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontSize: 14, ...css.rajdhani, fontWeight: 600 }}>
                  {e.note || cat.label}
                </div>
                <div style={{ color: T.muted, fontSize: 12 }}>{formatDate(e.date)}</div>
              </div>
              <div style={{ color: cat.color, ...css.orbitron, fontSize: 15, fontWeight: 700, marginRight: 8 }}>
                ₹{Number(e.amount).toLocaleString()}
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                style={{
                  background: 'none', border: 'none', color: T.muted,
                  cursor: 'pointer', fontSize: 16, padding: '4px 6px',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={ev => ev.target.style.color = T.danger}
                onMouseLeave={ev => ev.target.style.color = T.muted}
              >✕</button>
            </div>
          );
        })
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
