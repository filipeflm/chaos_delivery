import type { GameState } from './types';
import { VIRTUAL_W, VIRTUAL_H, TILE, ROAD_COLS, ROAD_ROWS, PLAYER_SIZE, PACKAGE_SIZE, CAR_W, CAR_H } from './constants';
import { CITY_GRID, TILE_BUILDING, TILE_PUDDLE, getBuildingColor } from './cityMap';
import type { Skin } from './skins';
import { getSkin } from './skins';

// ─── Palette helpers ──────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── City tiles ───────────────────────────────────────────────────────────────

function drawCity(ctx: CanvasRenderingContext2D): void {
  const rows = CITY_GRID.length;
  const cols = CITY_GRID[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const type = CITY_GRID[r][c];
      if (type === TILE_BUILDING) drawBuilding(ctx, x, y, c, r);
      else drawRoadTile(ctx, x, y, type);
    }
  }

  drawRoadMarkings(ctx);
  drawCrosswalks(ctx);
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, c: number, r: number): void {
  const baseColor = getBuildingColor(c, r);
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, TILE, TILE);

  // Top edge (roof line)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y, TILE, 3);

  // Subtle border
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

  // Windows grid
  if (r > 0 && r < CITY_GRID.length - 1 && c > 0 && c < CITY_GRID[0].length - 1) {
    const winW = 7, winH = 6, gapX = 5, gapY = 6;
    const cols2 = Math.floor((TILE - 8) / (winW + gapX));
    const rows2 = Math.floor((TILE - 10) / (winH + gapY));
    const offsetX = x + Math.floor((TILE - cols2 * (winW + gapX) + gapX) / 2);
    const offsetY = y + 8;

    for (let wr = 0; wr < rows2; wr++) {
      for (let wc = 0; wc < cols2; wc++) {
        const wx = offsetX + wc * (winW + gapX);
        const wy = offsetY + wr * (winH + gapY);
        const litHash = (c * 7 + r * 13 + wc * 3 + wr * 5) % 7;
        const lit = litHash > 1;
        ctx.fillStyle = lit ? 'rgba(255,230,100,0.75)' : 'rgba(30,40,70,0.55)';
        ctx.fillRect(wx, wy, winW, winH);
        if (lit) {
          ctx.fillStyle = 'rgba(255,255,200,0.25)';
          ctx.fillRect(wx, wy, 2, winH);
        }
      }
    }

    // Occasional ground-floor features (door or sign)
    const featureType = (c * 11 + r * 7) % 5;
    if (featureType === 0) {
      // Door
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + TILE / 2 - 5, y + TILE - 14, 10, 14);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + TILE / 2 + 2, y + TILE - 9, 2, 2);
    } else if (featureType === 1) {
      // Awning
      ctx.fillStyle = withAlpha(['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][((c + r) % 4)], 0.85);
      ctx.fillRect(x + 4, y + TILE / 2 - 2, TILE - 8, 5);
    }
  }
}

function drawRoadTile(ctx: CanvasRenderingContext2D, x: number, y: number, type: number): void {
  ctx.fillStyle = '#3d3d45';
  ctx.fillRect(x, y, TILE, TILE);

  // Subtle road texture lines
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + i * 10, y, 1, TILE);
  }

  if (type === TILE_PUDDLE) {
    ctx.fillStyle = 'rgba(70,140,200,0.4)';
    ctx.fillRect(x, y, TILE, TILE);
  }
}

function drawRoadMarkings(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,160,0.35)';

  for (const row of ROAD_ROWS) {
    const y = row * TILE + TILE / 2;
    ctx.beginPath();
    ctx.moveTo(TILE * 2, y);
    ctx.lineTo(VIRTUAL_W - TILE * 2, y);
    ctx.stroke();
  }
  for (const col of ROAD_COLS) {
    const x = col * TILE + TILE / 2;
    ctx.beginPath();
    ctx.moveTo(x, TILE);
    ctx.lineTo(x, VIRTUAL_H - TILE);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

function drawCrosswalks(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  const stripeW = 6;

  for (const row of ROAD_ROWS) {
    for (const col of ROAD_COLS) {
      const cx = col * TILE;
      const cy = row * TILE;

      // Horizontal stripes (N and S sides of intersection)
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx + 3 + i * 9, cy - 4, stripeW, 4);       // north
        ctx.fillRect(cx + 3 + i * 9, cy + TILE, stripeW, 4);     // south
      }
      // Vertical stripes (W and E)
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 4, cy + 3 + i * 9, 4, stripeW);        // west
        ctx.fillRect(cx + TILE, cy + 3 + i * 9, 4, stripeW);     // east
      }
    }
  }
  ctx.restore();
}

// ─── Puddles ──────────────────────────────────────────────────────────────────

function drawPuddles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const puddle of state.puddles) {
    const pulse = 1 + Math.sin(puddle.animTimer * 1.2) * 0.06;
    const r = puddle.radius * pulse;
    const r2 = r * 0.6;

    const grad = ctx.createRadialGradient(puddle.x, puddle.y, 0, puddle.x, puddle.y, r);
    grad.addColorStop(0, 'rgba(80,180,240,0.55)');
    grad.addColorStop(0.65, 'rgba(50,130,200,0.35)');
    grad.addColorStop(1, 'rgba(30,100,180,0.0)');

    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, r, r2, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shimmer line
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, r * 0.5, r2 * 0.3, -0.3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,230,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// ─── Zones ────────────────────────────────────────────────────────────────────

function drawZone(ctx: CanvasRenderingContext2D, x: number, y: number, pulseTimer: number,
                  color: string, label: string, isTarget: boolean): void {
  const t = pulseTimer;
  const outerPulse = 1 + Math.sin(t) * 0.15;
  const R = TILE * 0.85 * outerPulse;

  // Outer glow rings
  for (let i = 3; i >= 0; i--) {
    const alpha = (0.1 - i * 0.02) * (1 + Math.sin(t + i * 0.5) * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, R * (1 + i * 0.35), 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(color, alpha);
    ctx.fill();
  }

  // Disk
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  const diskGrad = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, 18);
  diskGrad.addColorStop(0, withAlpha(color, 1));
  diskGrad.addColorStop(1, withAlpha(color, 0.7));
  ctx.fillStyle = diskGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(label, x, y);

  // Bouncing arrow for target zone
  if (isTarget) {
    const bounce = Math.sin(t * 2.5) * 4;
    ctx.save();
    ctx.translate(x, y - 30 - bounce);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, -14);
    ctx.lineTo(9, -14);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

function drawCar(ctx: CanvasRenderingContext2D, car: GameState['cars'][0], stageIdx: number): void {
  ctx.save();
  ctx.translate(car.x, car.y);

  const angle =
    car.dir === 'right' ? 0 :
    car.dir === 'left'  ? Math.PI :
    car.dir === 'down'  ? Math.PI / 2 : -Math.PI / 2;

  ctx.rotate(angle);

  const isH = car.dir === 'left' || car.dir === 'right';
  const w = isH ? CAR_W : CAR_H;
  const h = isH ? CAR_H : CAR_W;
  const hw = w / 2, hh = h / 2;
  const speed = Math.sqrt(car.vx ** 2 + car.vy ** 2);

  // Speed trail at high stages
  if (stageIdx >= 2 && speed > 130) {
    const trailLen = Math.min(40, speed * 0.18);
    const trailAlpha = Math.min(0.4, (speed - 130) / 400);
    const trailGrad = ctx.createLinearGradient(-hw - trailLen, 0, -hw, 0);
    trailGrad.addColorStop(0, 'rgba(255,255,255,0)');
    trailGrad.addColorStop(1, withAlpha(car.color, trailAlpha));
    ctx.fillStyle = trailGrad;
    ctx.fillRect(-hw - trailLen, -hh * 0.6, trailLen, hh * 1.2);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(2, hh * 0.5, hw * 0.85, hh * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(-hw, -hh, w, h, 5);
  ctx.fill();

  // Roof
  ctx.fillStyle = 'rgba(20,20,50,0.65)';
  ctx.beginPath();
  ctx.roundRect(-hw * 0.55, -hh * 0.7, w * 0.55, h * 0.85, 4);
  ctx.fill();

  // Headlights (front)
  ctx.shadowColor = car.honking ? '#fef08a' : 'transparent';
  ctx.shadowBlur = car.honking ? 10 : 0;
  ctx.fillStyle = car.honking ? '#fef08a' : 'rgba(255,235,120,0.9)';
  ctx.fillRect(hw - 5, -hh + 2, 4, 5);
  ctx.fillRect(hw - 5, hh - 7, 4, 5);
  ctx.shadowBlur = 0;

  // Tail lights
  ctx.fillStyle = 'rgba(220,40,40,0.9)';
  ctx.fillRect(-hw + 1, -hh + 2, 3, 5);
  ctx.fillRect(-hw + 1, hh - 7, 3, 5);

  ctx.restore();

  // Honk text floating above
  if (car.honking && car.honkTimer > 0.3) {
    ctx.save();
    ctx.translate(car.x, car.y - Math.abs(hh) - 14);
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText('HONK!', 0, 0);
    ctx.fillText('HONK!', 0, 0);
    ctx.restore();
  }
}

// ─── Pedestrians ──────────────────────────────────────────────────────────────

function drawPedestrian(ctx: CanvasRenderingContext2D, ped: GameState['pedestrians'][0]): void {
  const bob = Math.sin(ped.bobTimer) * 1.8;
  ctx.save();
  ctx.translate(ped.x, ped.y + bob);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = ped.color;
  ctx.beginPath();
  ctx.roundRect(-7, -4, 14, 14, 3);
  ctx.fill();

  // Jacket highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-6, -3, 4, 12);

  // Head
  ctx.fillStyle = ped.variant < 2 ? '#f5cba7' : '#c68642';
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = ped.hatColor;
  ctx.fillRect(-7, -18, 14, 5);
  ctx.fillRect(-5, -22, 10, 5);

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-3, -12, 2, 2);
  ctx.fillRect(1, -12, 2, 2);

  if (ped.state === 'fleeing') {
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('😱', 0, -30);
  }

  ctx.restore();
}

// ─── Player ───────────────────────────────────────────────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, skin: Skin): void {
  const p = state.player;

  if (p.invincible && Math.floor(p.invincibleTimer * 10) % 2 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.35;
  }

  ctx.save();
  ctx.translate(p.x, p.y + p.bobOffset);
  ctx.rotate(p.angle);
  ctx.scale(p.squashX, p.squashY);

  // Glow when carrying
  if (p.isCarrying) {
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 14;
  }

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, PLAYER_SIZE / 2 + 3, PLAYER_SIZE * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated walk)
  const legBob = Math.sin(p.bobTimer * 2) * 4;
  ctx.fillStyle = skin.legsColor;
  ctx.fillRect(-7, 4, 5, 11 + legBob);
  ctx.fillRect(2, 4, 5, 11 - legBob);

  // Shoes
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-8, 14 + legBob, 6, 3);
  ctx.fillRect(2, 14 - legBob, 6, 3);

  // Body (uniform)
  ctx.fillStyle = skin.bodyColor;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 16, 4);
  ctx.fill();

  // Uniform stripe / zipper
  ctx.fillStyle = skin.accentColor;
  ctx.fillRect(-2, -6, 4, 16);

  // Collar
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(-4, -6, 8, 3);

  // Arms
  ctx.fillStyle = skin.headColor;
  if (p.isCarrying) {
    ctx.fillRect(-15, -5, 7, 11);
    ctx.fillRect(8, -5, 7, 11);
  } else {
    const armSwing = Math.sin(p.bobTimer) * 6;
    ctx.fillRect(-13, -2 + armSwing, 5, 10);
    ctx.fillRect(8, -2 - armSwing, 5, 10);
  }

  // Head
  ctx.fillStyle = skin.headColor;
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();

  // Cap body
  ctx.fillStyle = skin.capColor;
  ctx.fillRect(-10, -23, 20, 8);
  // Cap brim
  ctx.fillRect(-13, -18, 26, 4);
  // Cap logo
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-3, -22, 6, 5);
  // Brim shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-13, -15, 26, 2);

  // Eyes
  const blink = Math.abs(Math.sin(p.bobTimer * 0.2)) > 0.02;
  if (blink) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-5, -17, 3, 4);
    ctx.fillRect(2, -17, 3, 4);
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -18, 3, 2);
    ctx.fillRect(2, -18, 3, 2);
    // Pupils
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-4, -16, 2, 2);
    ctx.fillRect(3, -16, 2, 2);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-5, -14, 3, 1);
    ctx.fillRect(2, -14, 3, 1);
  }

  // Mouth (grin)
  const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
  ctx.fillStyle = '#c0392b';
  if (speed > 100) {
    // open mouth running
    ctx.fillRect(-3, -11, 6, 3);
    ctx.fillStyle = '#fde8e8';
    ctx.fillRect(-2, -10, 4, 2);
  } else {
    ctx.fillRect(-3, -11, 6, 2);
  }

  // Glow when carrying (re-apply)
  if (p.isCarrying) {
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'transparent';
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  if (p.invincible && Math.floor(p.invincibleTimer * 10) % 2 === 0) {
    ctx.restore();
  }
}

// ─── Package ──────────────────────────────────────────────────────────────────

function drawPackage(ctx: CanvasRenderingContext2D, state: GameState): void {
  const pkg = state.pkg;
  const p = state.player;
  const h = PACKAGE_SIZE;

  ctx.save();
  ctx.translate(pkg.x, pkg.y);
  ctx.rotate(pkg.rotation + Math.sin(pkg.wobble) * 0.22);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(2, h / 2 + 4, h * 0.55, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Box with gradient
  const boxGrad = ctx.createLinearGradient(-h / 2, -h / 2, h / 2, h / 2);
  boxGrad.addColorStop(0, '#a35c0e');
  boxGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = boxGrad;
  ctx.beginPath();
  ctx.roundRect(-h / 2, -h / 2, h, h, 2);
  ctx.fill();

  // Tape cross
  ctx.fillStyle = '#92400e';
  ctx.fillRect(-h / 2, -2, h, 4);
  ctx.fillRect(-2, -h / 2, 4, h);

  // Label
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(-h / 2 + 4, -h / 2 + 4, h - 8, h - 8);

  // Address lines
  ctx.fillStyle = '#374151';
  ctx.fillRect(-h / 2 + 6, -h / 2 + 7, h - 14, 2);
  ctx.fillRect(-h / 2 + 6, -h / 2 + 11, h - 18, 2);
  ctx.fillRect(-h / 2 + 6, -h / 2 + 15, h - 16, 2);

  // Highlight top edge
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-h / 2, -h / 2, h, 2);

  // Glow when on ground near pickup
  if (pkg.onGround && !p.isCarrying) {
    ctx.strokeStyle = 'rgba(34,197,94,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-h / 2 - 3, -h / 2 - 3, h + 6, h + 6, 4);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Effects ──────────────────────────────────────────────────────────────────

function drawEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  const eff = state.effects;

  for (const p of eff.particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    // Star-like particle at end of life
    const size = p.size * (alpha > 0.5 ? 1 : alpha * 2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const ft of eff.floatTexts) {
    const alpha = Math.min(1, ft.life / ft.maxLife * 2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ft.x, ft.y);
    ctx.scale(ft.scale, ft.scale);
    const fontSize = 14;
    ctx.font = `900 ${fontSize}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, 0, 0);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Delivery flash
  if (eff.deliveryFlash > 0) {
    ctx.fillStyle = `rgba(255,220,60,${eff.deliveryFlash * 0.2})`;
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
  }
}

// ─── Vignette / edge darkening ────────────────────────────────────────────────

function drawVignette(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createRadialGradient(
    VIRTUAL_W / 2, VIRTUAL_H / 2, VIRTUAL_W * 0.3,
    VIRTUAL_W / 2, VIRTUAL_H / 2, VIRTUAL_W * 0.8,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
}

// ─── Main render entry ────────────────────────────────────────────────────────

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, scale: number, skinId = 'classic'): void {
  const eff = state.effects;
  const skin = getSkin(skinId);

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(eff.shakeX, eff.shakeY);

  // Background
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

  // World layers
  drawCity(ctx);
  drawPuddles(ctx, state);

  // Zones
  const carrying = state.player.isCarrying;
  drawZone(ctx, state.pickupZone.x, state.pickupZone.y, state.pickupZone.pulseTimer, '#22c55e', 'PICKUP', !carrying);
  drawZone(ctx, state.deliveryZone.x, state.deliveryZone.y, state.deliveryZone.pulseTimer, '#ef4444', 'DELIVER', carrying);

  // Cars (back layer)
  for (const car of state.cars) {
    drawCar(ctx, car, state.currentStageIdx);
  }

  // Pedestrians
  for (const ped of state.pedestrians) {
    drawPedestrian(ctx, ped);
  }

  // Package on ground → draw before player
  if (!state.player.isCarrying) {
    drawPackage(ctx, state);
  }

  // Player
  drawPlayer(ctx, state, skin);

  // Package carried → draw after player (on top / in arms)
  if (state.player.isCarrying) {
    drawPackage(ctx, state);
  }

  // Effects
  drawEffects(ctx, state);

  // Vignette on top of everything
  drawVignette(ctx);

  ctx.restore();
}
