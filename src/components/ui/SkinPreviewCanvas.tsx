import { useEffect, useRef } from 'react';
import type { Skin } from '../../game/skins';

// Polyfill-safe rounded rect helper
function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
  ctx.closePath();
}

function drawChar(ctx: CanvasRenderingContext2D, skin: Skin, t: number) {
  const bob   = Math.sin(t * 2.8) * 2.5;
  const legL  = Math.sin(t * 5.6) * 4;
  const legR  = -legL;
  const armL  = Math.sin(t * 2.8) * 5;
  const blink = Math.abs(Math.sin(t * 0.55)) > 0.04;

  ctx.save();
  ctx.translate(0, bob);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = skin.legsColor;
  ctx.fillRect(-8, 5, 6, 13 + legL);
  ctx.fillRect(2, 5, 6, 13 + legR);

  // Shoes
  ctx.fillStyle = '#111827';
  ctx.fillRect(-9, 17 + legL, 7, 3);
  ctx.fillRect(2, 17 + legR, 7, 3);

  // Body
  ctx.fillStyle = skin.bodyColor;
  rr(ctx, -11, -8, 22, 18, 5);
  ctx.fill();

  // Centre stripe
  ctx.fillStyle = skin.accentColor;
  ctx.fillRect(-2, -8, 4, 18);

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-6, -8, 12, 3);

  // Arms
  ctx.fillStyle = skin.headColor;
  ctx.fillRect(-17, -3 + armL, 7, 12);
  ctx.fillRect(10, -3 - armL, 7, 12);

  // Head
  ctx.fillStyle = skin.headColor;
  ctx.beginPath();
  ctx.arc(0, -18, 11, 0, Math.PI * 2);
  ctx.fill();

  // Cap brim
  ctx.fillStyle = skin.capColor;
  ctx.fillRect(-14, -21, 28, 4);
  // Cap top
  ctx.fillRect(-10, -29, 20, 9);
  // Cap sheen
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-3, -28, 7, 5);
  // Cap shadow line
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-14, -18, 28, 2);

  // Eyes
  if (blink) {
    ctx.fillStyle = '#111';
    ctx.fillRect(-7, -22, 5, 6);
    ctx.fillRect(2, -22, 5, 6);
    ctx.fillStyle = 'white';
    ctx.fillRect(-7, -23, 5, 2);
    ctx.fillRect(2, -23, 5, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, -21, 3, 3);
    ctx.fillRect(3, -21, 3, 3);
  } else {
    ctx.fillStyle = '#333';
    ctx.fillRect(-7, -17, 5, 1);
    ctx.fillRect(2, -17, 5, 1);
  }

  // Mouth (smile)
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-3, -13, 6, 2);
  ctx.fillStyle = '#fde8e8';
  ctx.fillRect(-2, -12, 4, 1);

  // Animated glow aura
  const gAlpha = (Math.sin(t * 1.8) * 0.5 + 0.5) * 0.10 + 0.04;
  ctx.globalAlpha = gAlpha;
  ctx.shadowColor = skin.glowColor;
  ctx.shadowBlur = 24;
  ctx.fillStyle = skin.glowColor;
  ctx.beginPath();
  ctx.arc(0, -6, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.restore();
}

interface Props {
  skin: Skin;
  size?: number;
}

export function SkinPreviewCanvas({ skin, size = 100 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const startRef  = useRef(performance.now());

  // Reset animation start on skin change so entry anim replays
  useEffect(() => { startRef.current = performance.now(); }, [skin.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function frame(ts: number) {
      if (!canvas || !ctx) return;
      const t = (ts - startRef.current) / 1000;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      // Character bounding box ~60 units tall; centre with slight bottom bias
      const sc = size / 64;
      ctx.translate(size / 2, size / 2 + 10 * sc);
      ctx.scale(sc, sc);
      drawChar(ctx, skin, t);
      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [skin, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
