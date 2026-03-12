import { useState, useMemo } from 'react';
import { formatDate, uid, checkBadges, useTheme } from './theme';

function today() { return new Date().toISOString().slice(0, 10); }

function AddModal({ onClose, onAdd }) {
  const { T, css } = useTheme();
  const [type, setType] = useState('lent');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !amount) return;
    onAdd({ id: uid(), type, name: name.trim(), amount: Number(amount), note, dueDate, settled: false, createdAt: today(), settledAt: null });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn 0.2s' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111', borderRadius: '20px 20px 0 0', padding: 20, animation: 'slideUp 0.3s', border: '1px solid #1e1e1e', borderBottom: 'none', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
        <span style={css.sectionLabel}>LOG TRANSACTION</span>

        {/* Type Toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
          {[
            { id: 'lent', label: 'MAINE DIYA 💸' },
            { id: 'borrowed', label: 'MAINE LIYA 🤲' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setType(opt.id)} style={{
              flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
              background: type === opt.id ? (opt.id === 'lent' ? T.primaryDim : '#2a0010') : '#1a1a1a',
              color: type === opt.id ? (opt.id === 'lent' ? T.primary : T.danger) : T.muted,
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s',
              borderRight: opt.id === 'lent' ? '1px solid #2a2a2a' : 'none',
            }}>{opt.label}</button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <input style={css.input} placeholder="Friend's name" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="number" style={{ ...css.input, fontSize: 22, ...css.orbitron, color: type === 'lent' ? T.primary : T.danger, textAlign: 'center' }}
            placeholder="₹ Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input style={css.input} placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: T.muted, fontSize: 12, ...css.rajdhani, marginBottom: 6 }}>Reminder Date</div>
          <input type="date" style={css.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ ...css.ghostBtn, flex: 1 }} onClick={onClose}>CANCEL</button>
          <button style={{ ...css.neonBtn, flex: 2, opacity: (!name || !amount) ? 0.5 : 1 }} onClick={handleSubmit} disabled={!name || !amount}>LOG IT ✓</button>
        </div>
      </div>
    </div>
  );
}

function SplitCalc({ onAddToSettle }) {
  const { T, css } = useTheme();
  const [total, setTotal] = useState('');
  const [people, setPeople] = useState('2');
  const per = total && people ? Math.round(Number(total) / Number(people)) : 0;

  return (
    <div style={{ ...css.darkCard, marginTop: 16 }}>
      <span style={css.sectionLabel}>SPLIT BILL 🍕</span>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input type="number" style={{ ...css.input, flex: 2 }} placeholder="Total amount" value={total} onChange={e => setTotal(e.target.value)} />
        <input type="number" style={{ ...css.input, flex: 1 }} placeholder="People" value={people} onChange={e => setPeople(e.target.value)} />
      </div>
      {per > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ color: T.muted, fontSize: 11, ...css.orbitron, letterSpacing: 1 }}>PER PERSON</div>
          <div style={{ ...css.orbitron, fontSize: 32, fontWeight: 900, color: T.primary }}>₹{per.toLocaleString()}</div>
        </div>
      )}
      <button style={{ ...css.ghostBtn, width: '100%', opacity: per ? 1 : 0.5 }} onClick={() => per && onAddToSettle(per, total, people)} disabled={!per}>
        ADD TO SETTLE UP
      </button>
    </div>
  );
}

export default function Dues({ data, setData }) {
  const { T, css } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const pending = useMemo(() => data.borrows.filter(b => !b.settled), [data.borrows]);
  const settled = useMemo(() => data.borrows.filter(b => b.settled), [data.borrows]);
  const toReceive = pending.filter(b => b.type === 'lent').reduce((s, b) => s + Number(b.amount), 0);
  const toGive = pending.filter(b => b.type === 'borrowed').reduce((s, b) => s + Number(b.amount), 0);

  const isOverdue = (b) => b.dueDate && b.dueDate < today() && !b.settled;

  const handleAdd = (borrow) => {
    setData(prev => {
      const newData = { ...prev, borrows: [borrow, ...prev.borrows] };
      newData.earnedBadges = checkBadges(newData);
      return newData;
    });
  };

  const handleSettle = (id) => {
    setData(prev => {
      const newBorrows = prev.borrows.map(b => b.id === id ? { ...b, settled: true, settledAt: today() } : b);
      const newData = { ...prev, borrows: newBorrows };
      newData.earnedBadges = checkBadges(newData);
      return newData;
    });
  };

  const handleDelete = (id) => {
    setData(prev => ({ ...prev, borrows: prev.borrows.filter(b => b.id !== id) }));
  };

  const handleWhatsApp = (b) => {
    const msg = b.type === 'lent'
      ? `Hey ${b.name}! Bhai/Behen, ₹${b.amount} wapas karna tha 🙏 ${b.note ? `(${b.note})` : ''} — SPENTWELL`
      : `Hey ${b.name}! Maine tumhara ₹${b.amount} dena tha — ab de raha hun 😅 — SPENTWELL`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSplitAddToSettle = (perPerson, total, people) => {
    const newBorrow = { id: uid(), type: 'lent', name: `Split (${people} people)`, amount: perPerson * (Number(people) - 1), note: `Total ₹${total}, ₹${perPerson}/person`, dueDate: '', settled: false, createdAt: today(), settledAt: null };
    handleAdd(newBorrow);
    setData(prev => ({ ...prev, splitHistory: [{ id: uid(), total, people, perPerson, date: today() }, ...(prev.splitHistory || [])] }));
  };

  const BorrowCard = ({ b }) => {
    const { T, css } = useTheme();
    const overdue = isOverdue(b);
    return (
      <div style={{
        ...css.darkCard, marginBottom: 10,
        border: `1px solid ${overdue ? T.danger : '#1e1e1e'}`,
        boxShadow: overdue ? `0 0 12px ${T.danger}33` : 'none',
        animation: 'fadeUp 0.3s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ ...css.rajdhani, fontWeight: 700, fontSize: 16, color: T.text }}>{b.name}</div>
            {b.note && <div style={{ color: T.muted, fontSize: 12, ...css.rajdhani }}>{b.note}</div>}
            {b.dueDate && (
              <div style={{ fontSize: 11, color: overdue ? T.danger : T.muted, marginTop: 2 }}>
                {overdue ? '⚠️ OVERDUE' : '📅'} {formatDate(b.dueDate)}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...css.orbitron, fontSize: 18, fontWeight: 900, color: b.type === 'lent' ? T.primary : T.danger }}>
              ₹{Number(b.amount).toLocaleString()}
            </div>
            <div style={{
              fontSize: 10, ...css.orbitron, letterSpacing: 1, marginTop: 2,
              color: b.type === 'lent' ? T.primary : T.danger,
              background: b.type === 'lent' ? T.primaryDim : '#2a0010',
              borderRadius: 4, padding: '2px 6px', display: 'inline-block',
            }}>
              {b.type === 'lent' ? 'OWES YOU' : 'YOU OWE'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleWhatsApp(b)} style={{ ...css.ghostBtn, flex: 1, fontSize: 11, padding: '7px 4px' }}>📱 WA</button>
          <button onClick={() => handleSettle(b.id)} style={{
            flex: 2, fontSize: 11, padding: '7px 4px', cursor: 'pointer',
            background: T.primaryDim, border: `1px solid ${T.primary}`, borderRadius: 8,
            color: T.primary, fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: 1,
          }}>✓ SETTLED</button>
          <button onClick={() => handleDelete(b.id)} style={{
            width: 36, background: 'none', border: '1px solid #2a2a2a', borderRadius: 8,
            color: T.muted, cursor: 'pointer', fontSize: 16, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.target.style.color = T.danger}
            onMouseLeave={e => e.target.style.color = T.muted}
          >✕</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ ...css.orbitron, fontSize: 20, fontWeight: 900, color: T.text }}>SETTLE UP</span>
        <button style={css.neonBtn} onClick={() => setShowModal(true)}>+ LOG</button>
      </div>
      <div style={{ color: T.muted, ...css.rajdhani, fontSize: 13, marginBottom: 16 }}>Track money lent & borrowed from friends</div>

      {pending.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ ...css.darkCard, flex: 1, border: '1px solid #39ff1444', textAlign: 'center' }}>
            <div style={{ color: T.muted, fontSize: 9, ...css.orbitron, letterSpacing: 1 }}>RECEIVE KARNA HAI</div>
            <div style={{ color: T.primary, ...css.orbitron, fontSize: 18, fontWeight: 900, marginTop: 4 }}>₹{toReceive.toLocaleString()}</div>
          </div>
          <div style={{ ...css.darkCard, flex: 1, border: '1px solid #ff2d7844', textAlign: 'center' }}>
            <div style={{ color: T.muted, fontSize: 9, ...css.orbitron, letterSpacing: 1 }}>DENA HAI</div>
            <div style={{ color: T.danger, ...css.orbitron, fontSize: 18, fontWeight: 900, marginTop: 4 }}>₹{toGive.toLocaleString()}</div>
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: T.muted, ...css.rajdhani }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
          All clear! No pending dues.
        </div>
      )}

      {pending.map(b => <BorrowCard key={b.id} b={b} />)}

      {settled.length > 0 && (
        <div style={{ opacity: 0.45, marginTop: 16 }}>
          <span style={{ ...css.sectionLabel, marginBottom: 10 }}>SETTLED</span>
          {settled.map(b => (
            <div key={b.id} style={{ ...css.darkCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '10px 14px' }}>
              <span style={{ color: T.mid, ...css.rajdhani, fontSize: 14 }}>✓ {b.name}</span>
              <span style={{ color: T.mid, ...css.orbitron, fontSize: 13 }}>₹{Number(b.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <SplitCalc onAddToSettle={handleSplitAddToSettle} />
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
