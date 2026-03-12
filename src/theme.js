import { createContext, useContext } from 'react';

export const THEMES = {
  dark: {
    bg: '#0a0a0a', card: '#111111', border: '#1e1e1e', primary: '#39ff14', primaryDim: '#39ff1422',
    text: '#e8e8e8', muted: '#555555', mid: '#888888', inputBg: '#1a1a1a',
    danger: '#ff2d78', yellow: '#ffd60a', cyan: '#00e5ff', purple: '#bf5af2',
    name: 'dark', shadow: '0 0 18px #39ff1433', overlay: 'rgba(0,0,0,0.85)'
  },
  light: {
    bg: '#f5f5f0', card: '#ffffff', border: '#e0e0e0', primary: '#1a7a05', primaryDim: '#1a7a0522',
    text: '#1a1a1a', muted: '#aaaaaa', mid: '#666666', inputBg: '#f0f0ec',
    danger: '#e8003d', yellow: '#c47a00', cyan: '#0077aa', purple: '#7b2fa8',
    name: 'light', shadow: '0 2px 12px rgba(0,0,0,0.08)', overlay: 'rgba(0,0,0,0.5)'
  }
};

export const ThemeContext = createContext(THEMES.dark);

export function useTheme() {
  const T = useContext(ThemeContext);
  return { T, css: getCss(T) };
}

export const CATEGORIES = [
  { id: 'food',          label: 'Food',          color: '#f4a261', emoji: '🍱' },
  { id: 'transport',     label: 'Transport',     color: '#00b4d8', emoji: '🚌' },
  { id: 'books',         label: 'Books',         color: '#e76f51', emoji: '📚' },
  { id: 'recharge',      label: 'Recharge',      color: '#9b5de5', emoji: '📱' },
  { id: 'entertainment', label: 'Entertainment', color: '#f72585', emoji: '🎮' },
  { id: 'rent',          label: 'Rent',          color: '#e9c46a', emoji: '🏠' },
  { id: 'stationery',    label: 'Stationery',    color: '#4cc9f0', emoji: '✏️' },
  { id: 'other',         label: 'Other',         color: '#adb5bd', emoji: '💸' },
];

export const FOOD_BUBBLES = [
  { id: 'chai',      label: 'Chai',      emoji: '☕', color: '#f4a261' },
  { id: 'vadapav',   label: 'Vada Pav',  emoji: '🍔', color: '#39ff14' },
  { id: 'pohe',      label: 'Pohe',      emoji: '🍚', color: '#ffd60a' },
  { id: 'juice',     label: 'Juice',     emoji: '🧃', color: '#00e5ff' },
  { id: 'misal',     label: 'Misal',     emoji: '🍲', color: '#ff6b35' },
  { id: 'maggi',     label: 'Maggi',     emoji: '🍜', color: '#bf5af2' },
  { id: 'samosa',    label: 'Samosa',    emoji: '🥟', color: '#ff2d78' },
  { id: 'lassi',     label: 'Lassi',     emoji: '🥛', color: '#4cc9f0' },
  { id: 'bhelpuri',  label: 'Bhelpuri',  emoji: '🥗', color: '#06d6a0' },
  { id: 'colddrink', label: 'Cold Drink',emoji: '🥤', color: '#e63946' },
];

export const WEEKLY_CHALLENGES = [
  'Spend under ₹50 on chai this week! ☕',
  'No food delivery for 5 days straight 💪',
  'Walk or cycle instead of auto for 3 days 🚲',
  'Cook at home at least 4 evenings 🍳',
  'No entertainment spend for 7 days 🎮',
];

export const STORAGE_KEY = 'spentwell_v3';

export const DEFAULT_DATA = {
  onboarded: false,
  user: { name: '', occupation: 'Student', budget: 7500, college: '' },
  expenses: [],
  borrows: [],
  bubbleAmounts: { chai: 120, vadapav: 280, pohe: 90, juice: 60, misal: 150, maggi: 200, samosa: 80, lassi: 110, bhelpuri: 70, colddrink: 50 },
  streak: 0,
  lastLogDate: null,
  earnedBadges: [],
  notifications: [],
  savingsGoals: [],
  splitHistory: [],
  antigravity: false,
};

export function getCss(T) {
  return {
    orbitron: { fontFamily: "'Orbitron', monospace" },
    rajdhani: { fontFamily: "'Rajdhani', sans-serif" },
    neonCard: {
      background: T.card,
      border: `2px solid ${T.primary}`,
      borderRadius: 12,
      boxShadow: T.shadow,
      padding: 16,
    },
    darkCard: {
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: 16,
    },
    neonBtn: {
      background: T.primary,
      color: T.name === 'dark' ? '#000' : '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '10px 20px',
      fontFamily: "'Orbitron', monospace",
      fontWeight: 700,
      fontSize: 12,
      cursor: 'pointer',
      letterSpacing: 1,
      transition: 'opacity 0.2s, background-color 0.2s',
    },
    ghostBtn: {
      background: 'transparent',
      color: T.primary,
      border: `1px solid ${T.primary}`,
      borderRadius: 8,
      padding: '10px 20px',
      fontFamily: "'Orbitron', monospace",
      fontWeight: 700,
      fontSize: 12,
      cursor: 'pointer',
      letterSpacing: 1,
      transition: 'opacity 0.2s, color 0.2s, border-color 0.2s',
    },
    sectionLabel: {
      fontFamily: "'Orbitron', monospace",
      fontSize: 10,
      color: T.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 8,
      display: 'block',
    },
    input: {
      background: T.inputBg,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      color: T.text,
      padding: '12px 14px',
      fontSize: 16,
      width: '100%',
      fontFamily: "'Rajdhani', sans-serif",
      outline: 'none',
    },
  };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getCatById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[7];
}

export function totalSpentThisMonth(expenses) {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  return expenses
    .filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; })
    .reduce((s, e) => s + Number(e.amount), 0);
}

export function daysLeftInMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1;
}

export function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function checkBadges(data) {
  const earned = [...(data.earnedBadges || [])];
  const add = (id) => { if (!earned.includes(id)) earned.push(id); };
  if (data.expenses.length >= 1) add('first_log');
  if (data.streak >= 3) add('streak_3');
  if (data.streak >= 7) add('streak_7');
  if (data.borrows.length > 0 && data.borrows.every(b => b.settled)) add('no_borrow');
  const now = new Date();
  if (now.getDate() > 25 && totalSpentThisMonth(data.expenses) < data.user.budget) add('budget_king');
  return earned;
}

export function updateStreak(data) {
  const t = today();
  const last = data.lastLogDate;
  let streak = data.streak || 0;
  if (last === t) return { streak, lastLogDate: last };
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (last === yStr) streak += 1;
  else streak = 1;
  return { streak, lastLogDate: t };
}
