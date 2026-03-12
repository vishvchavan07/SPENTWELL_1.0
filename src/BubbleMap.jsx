import { useEffect, useRef, useState, useCallback } from 'react';
import { FOOD_BUBBLES, useTheme } from './theme';

const MIN_R = 36, MAX_R = 95;

function initBubbles(amounts, W, H) {
  const vals = FOOD_BUBBLES.map(f => amounts[f.id] || 0);
  const maxV = Math.max(...vals, 1);
  const cx = W / 2, cy = H / 2;
  return FOOD_BUBBLES.map((f, i) => {
    const v = amounts[f.id] || 0;
    const r = MIN_R + (MAX_R - MIN_R) * (v / maxV);
    const angle = (i / FOOD_BUBBLES.length) * Math.PI * 2;
    const dist = Math.min(W, H) * 0.3;
    return {
      ...f,
      r,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.018 + Math.random() * 0.012,
      glowPulse: Math.random() * Math.PI * 2,
      flash: 0,
    };
  });
}

function updateRadii(bubbles, amounts) {
  const vals = FOOD_BUBBLES.map(f => amounts[f.id] || 0);
  const maxV = Math.max(...vals, 1);
  return bubbles.map((b, i) => {
    const v = amounts[FOOD_BUBBLES[i].id] || 0;
    return { ...b, r: MIN_R + (MAX_R - MIN_R) * (v / maxV) };
  });
}

export default function BubbleMap({ data, setData }) {
  const { T, css } = useTheme();
  const canvasRef = useRef(null);
  const bubblesRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const [antigravity, setAntigravity] = useState(data.antigravity || false);
  const [selected, setSelected] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 380, h: 600 });
  const amounts = data.bubbleAmounts;
  const totalFood = Object.values(amounts).reduce((s, v) => s + (v || 0), 0);

  // Init on mount
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight - 100;
    setCanvasSize({ w: W, h: H });
    bubblesRef.current = initBubbles(amounts, W, H);
  }, []);

  // Update sizes when amounts change
  useEffect(() => {
    if (bubblesRef.current) {
      bubblesRef.current = updateRadii(bubblesRef.current, amounts);
    }
  }, [amounts]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bubblesRef.current) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const ag = antigravity;
    frameRef.current++;
    const frame = frameRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // Watermark in antigravity mode
    if (ag) {
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.font = "bold 20px 'Orbitron', monospace";
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText('🛸 ANTIGRAVITY MODE', W / 2, H / 2);
      ctx.restore();
    }

    const bubbles = bubblesRef.current;

    // Physics
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.wobble += b.wobbleSpeed * (ag ? 2 : 1);
      b.glowPulse += 0.04;
      if (b.flash > 0) b.flash--;

      b.vy += Math.sin(b.wobble) * 0.04;
      b.vx += Math.cos(b.wobble * 0.7) * 0.02;

      if (!ag) {
        b.vx += (W / 2 - b.x) * 0.0003;
        b.vy += (H / 2 - b.y) * 0.0003;
      } else {
        b.vy -= 0.07;
        if (frame % 120 === 0) {
          b.vy -= 2 + Math.random() * 3;
        }
      }

      const damp = ag ? 0.992 : 0.985;
      b.vx *= damp;
      b.vy *= damp;

      b.x += b.vx;
      b.y += b.vy;

      // Wall bounce
      if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.7; }
      if (b.x + b.r > W) { b.x = W - b.r; b.vx *= -0.7; }
      if (b.y + b.r > H) { b.y = H - b.r; b.vy *= -0.7; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy *= ag ? -1 : -0.7; }
    }

    // Collision detection
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i], b2 = bubbles[j];
        const dx = b2.x - a.x, dy = b2.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minD = a.r + b2.r + 4;
        if (dist < minD && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = (minD - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b2.x += nx * overlap; b2.y += ny * overlap;
          const relVx = (b2.vx - a.vx) * nx + (b2.vy - a.vy) * ny;
          if (relVx < 0) {
            const imp = relVx * 0.55;
            a.vx += imp * nx; a.vy += imp * ny;
            b2.vx -= imp * nx; b2.vy -= imp * ny;
          }
          a.flash = 6; b2.flash = 6;
        }
      }
    }

    // Render bubbles
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const { x, y, r, color, emoji, label, flash, glowPulse } = b;
      const isSelected = selected === i;
      const glow = 16 + Math.sin(glowPulse) * 8 + (flash > 0 ? 12 : 0);
      const ag_color = ag ? (i % 2 === 0 ? T.cyan : T.purple) : color;
      const borderColor = isSelected ? '#ffffff' : ag_color;

      // Outer glow
      const og = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8);
      og.addColorStop(0, ag_color + '33');
      og.addColorStop(1, 'transparent');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill();

      // Body gradient
      const bg2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      bg2.addColorStop(0, ag_color + 'bb');
      bg2.addColorStop(0.6, ag_color + '55');
      bg2.addColorStop(1, ag_color + '11');
      ctx.fillStyle = bg2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

      // Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.shadowBlur = glow;
      ctx.shadowColor = borderColor;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      // Shine
      const shine = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, 1, x - r * 0.3, y - r * 0.35, r * 0.5);
      shine.addColorStop(0, 'rgba(255,255,255,0.35)');
      shine.addColorStop(1, 'transparent');
      ctx.fillStyle = shine;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

      // Emoji
      const emojiSize = r * 0.52;
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y - r * 0.18);

      // Label
      ctx.font = `bold ${Math.max(9, r * 0.22)}px 'Rajdhani', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x, y + r * 0.28);

      // Amount
      const amt = amounts[b.id] || 0;
      ctx.font = `bold ${Math.max(8, r * 0.2)}px 'Orbitron', monospace`;
      ctx.fillStyle = ag_color;
      ctx.fillText(`₹${amt}`, x, y + r * 0.52);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [antigravity, amounts, selected]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleCanvasTap = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = clientX - rect.left, my = clientY - rect.top;

    let found = null;
    const bubbles = bubblesRef.current || [];
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const dx = mx - b.x, dy = my - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.r) { found = i; break; }
    }
    setSelected(found);
  };

  const shake = () => {
    const bubbles = bubblesRef.current;
    if (!bubbles) return;
    bubbles.forEach(b => { b.vx += (Math.random() - 0.5) * 20; b.vy += (Math.random() - 0.5) * 20; });
  };

  const randomise = () => {
    const newAmounts = {};
    FOOD_BUBBLES.forEach(f => { newAmounts[f.id] = Math.floor(50 + Math.random() * 500); });
    setData(prev => ({ ...prev, bubbleAmounts: newAmounts }));
    setSelected(null);
  };

  const handleAntigravity = () => {
    const newAg = !antigravity;
    setAntigravity(newAg);
    setData(prev => ({ ...prev, antigravity: newAg }));
  };

  const selBubble = selected !== null && bubblesRef.current ? bubblesRef.current[selected] : null;
  const selAmount = selBubble ? (amounts[selBubble.id] || 0) : 0;
  const selPct = totalFood ? Math.round((selAmount / totalFood) * 100) : 0;

  const adjustAmount = (delta) => {
    if (!selBubble) return;
    const newAmt = Math.max(0, (amounts[selBubble.id] || 0) + delta);
    setData(prev => ({ ...prev, bubbleAmounts: { ...prev.bubbleAmounts, [selBubble.id]: newAmt } }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.bg, zIndex: 10 }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: '#0a0a0add', backdropFilter: 'blur(10px)',
        padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #1e1e1e',
      }}>
        <div>
          <div style={{ ...css.orbitron, fontSize: 13, fontWeight: 900, color: antigravity ? T.cyan : T.primary }}>
            FOOD BUBBLE MAP {antigravity ? '🛸' : ''}
          </div>
          <div style={{ color: T.muted, fontSize: 10, ...css.rajdhani }}>Bigger bubble = more kharcha</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: T.muted, fontSize: 9, ...css.orbitron, letterSpacing: 1 }}>TOTAL FOOD</div>
          <div style={{ color: T.primary, ...css.orbitron, fontSize: 14, fontWeight: 900 }}>₹{totalFood.toLocaleString()}</div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
        onClick={handleCanvasTap}
        onTouchStart={handleCanvasTap}
      />

      {/* Selected bubble info */}
      {selBubble && (
        <div style={{
          position: 'absolute', bottom: 110, left: 16, right: 16, zIndex: 20,
          ...css.darkCard, border: `1px solid ${selBubble.color}`,
          boxShadow: `0 0 20px ${selBubble.color}44`,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'fadeUp 0.2s',
        }}>
          <div style={{ fontSize: 28 }}>{selBubble.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ ...css.rajdhani, fontWeight: 700, color: T.text, fontSize: 15 }}>{selBubble.label}</div>
            <div style={{ color: T.muted, fontSize: 12 }}>{selPct}% of food spend</div>
          </div>
          <div style={{ color: selBubble.color, ...css.orbitron, fontSize: 18, fontWeight: 900 }}>₹{selAmount}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => adjustAmount(50)} style={{
              background: T.primaryDim, border: `1px solid ${T.primary}`, borderRadius: 6,
              color: T.primary, width: 36, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700,
            }}>+</button>
            <button onClick={() => adjustAmount(-50)} style={{
              background: '#2a0010', border: `1px solid ${T.danger}`, borderRadius: 6,
              color: T.danger, width: 36, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700,
            }}>−</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 20,
        display: 'flex', gap: 8, padding: '8px 16px',
        background: '#0a0a0add', backdropFilter: 'blur(10px)',
        borderTop: '1px solid #1e1e1e',
      }}>
        <button onClick={handleAntigravity} style={{
          ...css.ghostBtn, flex: 2, fontSize: 11, padding: '10px 8px',
          borderColor: antigravity ? T.purple : T.primary,
          color: antigravity ? T.purple : T.primary,
          background: antigravity ? '#1a0033' : 'transparent',
        }}>
          {antigravity ? '🌍 NORMAL' : '🛸 ANTIGRAVITY'}
        </button>
        <button onClick={shake} style={{
          ...css.ghostBtn, flex: 1, fontSize: 11, padding: '10px 4px',
          borderColor: T.danger, color: T.danger,
        }}>💥 SHAKE</button>
        <button onClick={randomise} style={{ ...css.ghostBtn, flex: 1, fontSize: 11, padding: '10px 4px' }}>
          🎲 RND
        </button>
      </div>
    </div>
  );
}
