import type { GameState } from './types';
import { VIRTUAL_W, VIRTUAL_H, TILE, ROAD_COLS, ROAD_ROWS, PLAYER_SIZE, PACKAGE_SIZE, CAR_W, CAR_H } from './constants';
import { CITY_GRID, TILE_BUILDING } from './cityMap';
import type { Skin } from './skins';
import { getSkin } from './skins';

// ─── Palette helpers ──────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Building archetypes ──────────────────────────────────────────────────────
// 5 types: brick, glass office, concrete brutalist, limestone classical, industrial

const ARCH = [
  { face: '#8B4A36', shade: '#5A2810', light: '#C4785A', win: '#FFD870', winD: '#2A1A08' }, // brick
  { face: '#2A5E78', shade: '#102840', light: '#5A9AB8', win: '#88D8F0', winD: '#082030' }, // glass
  { face: '#727E88', shade: '#464E58', light: '#9AAAB4', win: '#FFE898', winD: '#1E2028' }, // concrete
  { face: '#C4A868', shade: '#706030', light: '#E8CCA0', win: '#FFF8D8', winD: '#302818' }, // limestone
  { face: '#586050', shade: '#303828', light: '#7A8870', win: '#A8D870', winD: '#182010' }, // industrial
] as const;

function archOf(c: number, r: number): 0 | 1 | 2 | 3 | 4 {
  return ((c * 3 + r * 7 + c * r * 2) % 5) as 0 | 1 | 2 | 3 | 4;
}

function posHash(c: number, r: number, mod: number): number {
  return Math.abs(c * 11 + r * 17 + c * r * 3) % mod;
}

// ─── Building drawing ─────────────────────────────────────────────────────────

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, c: number, r: number): void {
  const ai = archOf(c, r);
  const pal = ARCH[ai];
  const totalRows = CITY_GRID.length;
  const totalCols = CITY_GRID[0].length;
  const isBorder = r < 1 || r >= totalRows - 1 || c < 1 || c >= totalCols - 1;

  // Base facade
  ctx.fillStyle = pal.face;
  ctx.fillRect(x, y, TILE, TILE);

  // Roof-edge shadow (depth cue)
  ctx.fillStyle = pal.shade;
  ctx.fillRect(x, y, TILE, 4);

  // Right-side shadow (3-D depth)
  ctx.fillStyle = withAlpha(pal.shade, 0.28);
  ctx.fillRect(x + TILE - 3, y + 4, 3, TILE - 4);

  // Bottom-left highlight
  ctx.fillStyle = withAlpha(pal.light, 0.1);
  ctx.fillRect(x, y + TILE - 3, TILE - 3, 3);

  // Border outline
  ctx.strokeStyle = withAlpha(pal.shade, 0.4);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

  if (isBorder) return;

  // ── Windows ──────────────────────────────────────────────────────────────

  if (ai === 1) {
    // Glass office: horizontal curtain-wall bands
    const bH = 5, bGap = 5, startY = y + 9;
    const bands = Math.floor((TILE - 15) / (bH + bGap));
    for (let i = 0; i < bands; i++) {
      const by = startY + i * (bH + bGap);
      const lit = (c * 5 + r * 9 + i * 3) % 7 > 1;
      ctx.fillStyle = lit ? withAlpha(pal.win, 0.75) : withAlpha(pal.winD, 0.65);
      ctx.fillRect(x + 3, by, TILE - 6, bH);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x + 3, by, 2, bH);
      }
    }
  } else {
    // Grid windows for archetypes 0, 2, 3, 4
    const wW = ai === 3 ? 8 : 7;
    const wH = ai === 3 ? 10 : 6;
    const gX = 5, gY = ai === 3 ? 7 : 6;
    const nC = Math.floor((TILE - 8) / (wW + gX));
    const nR = Math.floor((TILE - 14) / (wH + gY));
    const oX = x + Math.floor((TILE - nC * (wW + gX) + gX) / 2);
    const oY = y + 9;

    for (let wr = 0; wr < nR; wr++) {
      for (let wc = 0; wc < nC; wc++) {
        const wx = oX + wc * (wW + gX);
        const wy = oY + wr * (wH + gY);
        const lit = (c * 7 + r * 13 + wc * 3 + wr * 5) % 7 > 1;
        ctx.fillStyle = lit ? withAlpha(pal.win, 0.82) : withAlpha(pal.winD, 0.55);

        if (ai === 3 && wH >= 8) {
          // Limestone: arched window tops
          ctx.fillRect(wx, wy + 3, wW, wH - 3);
          ctx.beginPath();
          ctx.arc(wx + wW / 2, wy + 3, wW / 2, Math.PI, 0);
          ctx.fill();
        } else {
          ctx.fillRect(wx, wy, wW, wH);
        }
        if (lit) {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(wx, wy + (ai === 3 && wH >= 8 ? 3 : 0), 2, wH - (ai === 3 && wH >= 8 ? 3 : 0));
        }
      }
    }
  }

  // ── Ground floor ─────────────────────────────────────────────────────────

  const gFloorY = y + TILE - 13;
  ctx.fillStyle = withAlpha(pal.shade, 0.35);
  ctx.fillRect(x, gFloorY, TILE, 13);

  const gv = posHash(c, r, 6);
  if (gv === 0) {
    // Wooden door with handle
    ctx.fillStyle = '#4A2810';
    ctx.fillRect(x + TILE / 2 - 4, gFloorY + 1, 8, 12);
    ctx.fillStyle = '#6A3A18';
    ctx.fillRect(x + TILE / 2 - 3, gFloorY + 2, 3, 10);
    ctx.fillStyle = '#D4A060';
    ctx.fillRect(x + TILE / 2 + 2, gFloorY + 6, 2, 2);
  } else if (gv === 1) {
    // Shop front window
    ctx.fillStyle = withAlpha(pal.win, 0.3);
    ctx.fillRect(x + 3, gFloorY + 2, TILE - 6, 9);
    ctx.strokeStyle = withAlpha(pal.light, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3.5, gFloorY + 2.5, TILE - 7, 8);
  } else if (gv === 2) {
    // Coloured awning
    const awnings = ['#C83030', '#2858A8', '#38882A', '#C07020'] as const;
    ctx.fillStyle = withAlpha(awnings[(c + r) % 4], 0.88);
    ctx.fillRect(x + 2, gFloorY, TILE - 4, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i * 7, gFloorY, 3, 4);
  } else if (gv === 3) {
    // Garage shutter
    ctx.fillStyle = '#383E3E';
    ctx.fillRect(x + 4, gFloorY + 1, TILE - 8, 11);
    ctx.strokeStyle = '#505858';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, gFloorY + 1 + i * 3);
      ctx.lineTo(x + TILE - 4, gFloorY + 1 + i * 3);
      ctx.stroke();
    }
  }

  // ── Rooftop details ───────────────────────────────────────────────────────

  // Parapet strip
  ctx.fillStyle = withAlpha(pal.shade, 0.5);
  ctx.fillRect(x, y, TILE, 4);

  const rv = posHash(c, r, 8);
  if (rv === 0) {
    // Water tower
    const tx = x + TILE / 2 - 5, ty = y + 1;
    ctx.strokeStyle = '#505860';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty + 9); ctx.lineTo(tx, ty + 12);
    ctx.moveTo(tx + 8, ty + 9); ctx.lineTo(tx + 10, ty + 12);
    ctx.stroke();
    ctx.fillStyle = '#687880';
    ctx.fillRect(tx, ty + 2, 10, 8);
    ctx.fillStyle = '#8A9AA8';
    ctx.fillRect(tx, ty + 2, 10, 2);
    ctx.fillStyle = '#505860';
    ctx.beginPath();
    ctx.moveTo(tx - 1, ty + 2); ctx.lineTo(tx + 5, ty - 1); ctx.lineTo(tx + 11, ty + 2);
    ctx.closePath(); ctx.fill();
  } else if (rv === 1) {
    // HVAC unit
    ctx.fillStyle = '#686E78';
    ctx.fillRect(x + TILE / 2 - 9, y + 1, 18, 7);
    ctx.fillStyle = '#788088';
    ctx.fillRect(x + TILE / 2 - 7, y + 2, 14, 5);
    ctx.strokeStyle = '#505860';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(x + TILE / 2 - 3 + i * 6, y + 4.5, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (rv === 2) {
    // Billboard
    ctx.fillStyle = '#484848';
    ctx.fillRect(x + 6, y + 1, 2, 8);
    ctx.fillRect(x + TILE - 8, y + 1, 2, 8);
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(x + 4, y + 1, TILE - 8, 6);
    const bc = ['#C03030', '#2860B0', '#C07020', '#309040'] as const;
    ctx.fillStyle = bc[(c + r) % 4];
    ctx.fillRect(x + 5, y + 2, TILE - 10, 4);
  } else if (rv === 3) {
    // Antenna with blinking light
    ctx.strokeStyle = '#78889A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2, y + 4);
    ctx.lineTo(x + TILE / 2, y - 3);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2 - 5, y + 1);
    ctx.lineTo(x + TILE / 2 + 5, y + 1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,50,50,0.9)';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (rv === 4) {
    // Rooftop garden
    ctx.fillStyle = '#285A20';
    ctx.fillRect(x + 4, y + 1, 10, 5);
    ctx.fillRect(x + TILE - 14, y + 1, 10, 5);
    ctx.fillStyle = '#40802A';
    ctx.fillRect(x + 5, y + 1, 8, 3);
    ctx.fillRect(x + TILE - 13, y + 1, 8, 3);
  }
}

// ─── Road tiles ───────────────────────────────────────────────────────────────

function drawRoadTile(ctx: CanvasRenderingContext2D, x: number, y: number, _type: number): void {
  ctx.fillStyle = '#2A2A32';
  ctx.fillRect(x, y, TILE, TILE);

  // Subtle worn-asphalt texture (deterministic per tile)
  const h = ((x >> 2) * 7 + (y >> 2) * 11) % 16;
  if (h < 3) {
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
  }
}

// ─── Sidewalk curbs ───────────────────────────────────────────────────────────

function drawSidewalks(ctx: CanvasRenderingContext2D): void {
  const totalRows = CITY_GRID.length;
  const totalCols = CITY_GRID[0].length;
  const SW = 4; // curb width in px

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      if (CITY_GRID[r][c] === TILE_BUILDING) continue;
      const x = c * TILE, y = r * TILE;

      ctx.fillStyle = '#565662';
      if (r > 0 && CITY_GRID[r - 1][c] === TILE_BUILDING)         ctx.fillRect(x, y, TILE, SW);
      if (r < totalRows - 1 && CITY_GRID[r + 1][c] === TILE_BUILDING) ctx.fillRect(x, y + TILE - SW, TILE, SW);
      if (c > 0 && CITY_GRID[r][c - 1] === TILE_BUILDING)         ctx.fillRect(x, y, SW, TILE);
      if (c < totalCols - 1 && CITY_GRID[r][c + 1] === TILE_BUILDING) ctx.fillRect(x + TILE - SW, y, SW, TILE);

      // Curb highlight edge
      ctx.fillStyle = 'rgba(200,200,210,0.12)';
      if (r > 0 && CITY_GRID[r - 1][c] === TILE_BUILDING)         ctx.fillRect(x, y + SW, TILE, 1);
      if (r < totalRows - 1 && CITY_GRID[r + 1][c] === TILE_BUILDING) ctx.fillRect(x, y + TILE - SW - 1, TILE, 1);
      if (c > 0 && CITY_GRID[r][c - 1] === TILE_BUILDING)         ctx.fillRect(x + SW, y, 1, TILE);
      if (c < totalCols - 1 && CITY_GRID[r][c + 1] === TILE_BUILDING) ctx.fillRect(x + TILE - SW - 1, y, 1, TILE);
    }
  }
}

// ─── Road markings ────────────────────────────────────────────────────────────

function drawRoadMarkings(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Center lane dashes
  ctx.setLineDash([8, 10]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,180,0.28)';

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

  // Stop lines at intersection approaches
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  for (const row of ROAD_ROWS) {
    for (const col of ROAD_COLS) {
      const cx = col * TILE, cy = row * TILE;
      ctx.beginPath(); ctx.moveTo(cx + 4, cy - 2);       ctx.lineTo(cx + TILE - 4, cy - 2);       ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 4, cy + TILE + 2); ctx.lineTo(cx + TILE - 4, cy + TILE + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 2, cy + 4);       ctx.lineTo(cx - 2, cy + TILE - 4);       ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + TILE + 2, cy + 4); ctx.lineTo(cx + TILE + 2, cy + TILE - 4); ctx.stroke();
    }
  }

  ctx.restore();
}

// ─── Crosswalks ───────────────────────────────────────────────────────────────

function drawCrosswalks(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  const stripeW = 5;

  for (const row of ROAD_ROWS) {
    for (const col of ROAD_COLS) {
      const cx = col * TILE;
      const cy = row * TILE;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx + 3 + i * 9, cy - 4, stripeW, 4);
        ctx.fillRect(cx + 3 + i * 9, cy + TILE, stripeW, 4);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(cx - 4, cy + 3 + i * 9, 4, stripeW);
        ctx.fillRect(cx + TILE, cy + 3 + i * 9, 4, stripeW);
      }
    }
  }
  ctx.restore();
}

// ─── Street lamps ─────────────────────────────────────────────────────────────

function drawSingleLamp(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number,
  dirX: number, dirY: number,
): void {
  const postH = 15;
  const armX = bx + dirX * 9;
  const armY = by - postH + dirY * 5;

  ctx.strokeStyle = '#607080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - postH);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, by - postH);
  ctx.lineTo(armX, armY);
  ctx.stroke();

  ctx.shadowColor = 'rgba(255,228,100,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#FFF4A0';
  ctx.beginPath();
  ctx.arc(armX, armY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawStreetLamps(ctx: CanvasRenderingContext2D): void {
  const totalRows = CITY_GRID.length;
  const totalCols = CITY_GRID[0].length;

  for (const row of ROAD_ROWS) {
    for (const col of ROAD_COLS) {
      // Corners: [building col, building row, lamp base pixel x, lamp base pixel y, arm dir x, arm dir y]
      const corners: [number, number, number, number, number, number][] = [
        [col - 1, row - 1, col * TILE - 3,          row * TILE - 3,          1,  1],
        [col + 1, row - 1, (col + 1) * TILE + 3,    row * TILE - 3,         -1,  1],
        [col - 1, row + 1, col * TILE - 3,          (row + 1) * TILE + 3,    1, -1],
        [col + 1, row + 1, (col + 1) * TILE + 3,    (row + 1) * TILE + 3,  -1, -1],
      ];

      for (const [bc, br, px, py, dx, dy] of corners) {
        if (bc < 0 || bc >= totalCols || br < 0 || br >= totalRows) continue;
        if (CITY_GRID[br]?.[bc] !== TILE_BUILDING) continue;
        drawSingleLamp(ctx, px, py, dx, dy);
      }
    }
  }
}

// ─── City entry point ─────────────────────────────────────────────────────────

function drawCity(ctx: CanvasRenderingContext2D): void {
  const rows = CITY_GRID.length;
  const cols = CITY_GRID[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * TILE, y = r * TILE;
      const type = CITY_GRID[r][c];
      if (type === TILE_BUILDING) drawBuilding(ctx, x, y, c, r);
      else drawRoadTile(ctx, x, y, type);
    }
  }

  drawSidewalks(ctx);
  drawRoadMarkings(ctx);
  drawCrosswalks(ctx);
  drawStreetLamps(ctx);
}

// ─── Zones ────────────────────────────────────────────────────────────────────

function drawZone(ctx: CanvasRenderingContext2D, x: number, y: number, pulseTimer: number,
                  color: string, label: string, isTarget: boolean): void {
  const t = pulseTimer;
  const outerPulse = 1 + Math.sin(t) * 0.15;
  const R = TILE * 0.85 * outerPulse;

  for (let i = 3; i >= 0; i--) {
    const alpha = (0.1 - i * 0.02) * (1 + Math.sin(t + i * 0.5) * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, R * (1 + i * 0.35), 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(color, alpha);
    ctx.fill();
  }

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

  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(label, x, y);

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

  const hw = CAR_W / 2; // 17  — half-length (front/rear axis)
  const hh = CAR_H / 2; // 10  — half-width  (side axis)
  const speed = Math.sqrt(car.vx ** 2 + car.vy ** 2);
  const carType = car.id % 3; // 0=sedan, 1=SUV, 2=van
  const rr = ctx as CanvasRenderingContext2D & { roundRect: Function };

  // Speed trail
  if (stageIdx >= 2 && speed > 120) {
    const tLen = Math.min(52, speed * 0.2);
    const tAlpha = Math.min(0.45, (speed - 120) / 350);
    const tGrad = ctx.createLinearGradient(-hw - tLen, 0, -hw, 0);
    tGrad.addColorStop(0, 'rgba(255,255,255,0)');
    tGrad.addColorStop(1, withAlpha(car.color, tAlpha));
    ctx.fillStyle = tGrad;
    ctx.fillRect(-hw - tLen, -hh * 0.7, tLen, hh * 1.4);
  }

  // Ground shadow (directly under — top-down perspective)
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, hw + 2, hh + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Wheels (drawn before body so inner half hides under car) ──────────────
  const wheelR = carType === 1 ? 4.5 : 3.5;
  const xF = hw - 8, xR = -(hw - 8);
  const yW = hh + 1; // just outside body edge

  for (const [wx, wy] of [[xF, -yW], [xF, yW], [xR, -yW], [xR, yW]] as [number, number][]) {
    ctx.fillStyle = '#151518';
    ctx.beginPath(); ctx.arc(wx, wy, wheelR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888894';
    ctx.beginPath(); ctx.arc(wx, wy, wheelR * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#BEBEC8';
    ctx.beginPath(); ctx.arc(wx, wy, wheelR * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  // ── Main body ─────────────────────────────────────────────────────────────
  ctx.fillStyle = car.color;
  rr.roundRect(-hw, -hh, CAR_W, CAR_H, 4);
  ctx.fill();

  // Top-edge highlight (ambient light from above-left)
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.fillRect(-hw + 3, -hh, CAR_W - 6, 2);

  // ── Type-specific details ─────────────────────────────────────────────────
  if (carType === 0) {
    // Sedan — 3-box shape, compact roof

    // Roof (top-down view: darker center rectangle)
    ctx.fillStyle = 'rgba(0,0,0,0.44)';
    rr.roundRect(-7, -hh + 2, 16, CAR_H - 4, 2);
    ctx.fill();

    // Windshield (thin blue-tinted strip at front of roof)
    ctx.fillStyle = 'rgba(150,215,255,0.55)';
    ctx.fillRect(7, -hh + 3, 3, CAR_H - 6);

    // Rear window
    ctx.fillStyle = 'rgba(130,195,240,0.42)';
    ctx.fillRect(-10, -hh + 3, 3, CAR_H - 6);

    // Side mirrors (small tabs at front)
    ctx.fillStyle = withAlpha(car.color, 0.85);
    ctx.fillRect(hw - 9, -hh - 2, 3, 2);
    ctx.fillRect(hw - 9, hh,      3, 2);

  } else if (carType === 1) {
    // SUV — tall, wide, big roof

    // Larger roof spanning more of the body
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    rr.roundRect(-10, -hh + 2, 22, CAR_H - 4, 2);
    ctx.fill();

    // Windshield
    ctx.fillStyle = 'rgba(150,215,255,0.55)';
    ctx.fillRect(10, -hh + 3, 3, CAR_H - 6);

    // Rear window
    ctx.fillStyle = 'rgba(130,195,240,0.42)';
    ctx.fillRect(-13, -hh + 3, 3, CAR_H - 6);

    // Roof rack crossbars
    ctx.strokeStyle = withAlpha(car.roofColor, 0.65);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-7 + i * 5, -hh + 2);
      ctx.lineTo(-7 + i * 5, hh - 2);
      ctx.stroke();
    }

    // Running boards (side trim)
    ctx.fillStyle = withAlpha(car.roofColor, 0.32);
    ctx.fillRect(-hw + 2, -hh, CAR_W - 4, 2);
    ctx.fillRect(-hw + 2, hh - 2, CAR_W - 4, 2);

    // Side mirrors (larger)
    ctx.fillStyle = withAlpha(car.color, 0.85);
    ctx.fillRect(hw - 9, -hh - 3, 4, 3);
    ctx.fillRect(hw - 9, hh,      4, 3);

  } else {
    // Van — boxy, full-length cargo body

    // Full-span roof
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    rr.roundRect(-hw + 4, -hh + 2, CAR_W - 8, CAR_H - 4, 1);
    ctx.fill();

    // Cab windshield (front portion only)
    ctx.fillStyle = 'rgba(150,215,255,0.5)';
    ctx.fillRect(hw - 10, -hh + 3, 4, CAR_H - 6);

    // Rear double-door lines
    ctx.strokeStyle = withAlpha(car.roofColor, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw + 4, -hh + 3); ctx.lineTo(-hw + 4, hh - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hw + 2, 0); ctx.lineTo(-hw + 7, 0);
    ctx.stroke();

    // Company livery stripe
    ctx.fillStyle = withAlpha(car.roofColor, 0.25);
    ctx.fillRect(-hw + 5, -1, CAR_W - 16, 2);

    // Large side mirrors
    ctx.fillStyle = withAlpha(car.color, 0.85);
    ctx.fillRect(hw - 7, -hh - 3, 4, 3);
    ctx.fillRect(hw - 7, hh,      4, 3);
  }

  // ── Lights (all types) ────────────────────────────────────────────────────

  if (car.honking) { ctx.shadowColor = '#FFFE80'; ctx.shadowBlur = 10; }
  ctx.fillStyle = car.honking ? '#FFFE80' : 'rgba(255,242,160,0.92)';
  ctx.fillRect(hw - 3, -hh + 2, 3, 4);
  ctx.fillRect(hw - 3, hh - 6,  3, 4);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(210,40,40,0.92)';
  ctx.fillRect(-hw, -hh + 2, 3, 4);
  ctx.fillRect(-hw, hh - 6,  3, 4);

  ctx.restore();

  // Honk text (screen space, above car)
  if (car.honking && car.honkTimer > 0.3) {
    const screenHH = car.dir === 'up' || car.dir === 'down' ? CAR_W / 2 : CAR_H / 2;
    ctx.save();
    ctx.translate(car.x, car.y - screenHH - 16);
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

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ped.color;
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(-7, -4, 14, 14, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-6, -3, 4, 12);

  ctx.fillStyle = ped.variant < 2 ? '#f5cba7' : '#c68642';
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ped.hatColor;
  ctx.fillRect(-7, -18, 14, 5);
  ctx.fillRect(-5, -22, 10, 5);

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

  if (p.isCarrying) {
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 14;
  }

  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, PLAYER_SIZE / 2 + 3, PLAYER_SIZE * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const legBob = Math.sin(p.bobTimer * 2) * 4;
  ctx.fillStyle = skin.legsColor;
  ctx.fillRect(-7, 4, 5, 11 + legBob);
  ctx.fillRect(2, 4, 5, 11 - legBob);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-8, 14 + legBob, 6, 3);
  ctx.fillRect(2, 14 - legBob, 6, 3);

  ctx.fillStyle = skin.bodyColor;
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(-9, -6, 18, 16, 4);
  ctx.fill();

  ctx.fillStyle = skin.accentColor;
  ctx.fillRect(-2, -6, 4, 16);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(-4, -6, 8, 3);

  ctx.fillStyle = skin.headColor;
  if (p.isCarrying) {
    ctx.fillRect(-15, -5, 7, 11);
    ctx.fillRect(8, -5, 7, 11);
  } else {
    const armSwing = Math.sin(p.bobTimer) * 6;
    ctx.fillRect(-13, -2 + armSwing, 5, 10);
    ctx.fillRect(8, -2 - armSwing, 5, 10);
  }

  ctx.fillStyle = skin.headColor;
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.capColor;
  ctx.fillRect(-10, -23, 20, 8);
  ctx.fillRect(-13, -18, 26, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-3, -22, 6, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-13, -15, 26, 2);

  const blink = Math.abs(Math.sin(p.bobTimer * 0.2)) > 0.02;
  if (blink) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-5, -17, 3, 4);
    ctx.fillRect(2, -17, 3, 4);
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -18, 3, 2);
    ctx.fillRect(2, -18, 3, 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-4, -16, 2, 2);
    ctx.fillRect(3, -16, 2, 2);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-5, -14, 3, 1);
    ctx.fillRect(2, -14, 3, 1);
  }

  const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
  ctx.fillStyle = '#c0392b';
  if (speed > 100) {
    ctx.fillRect(-3, -11, 6, 3);
    ctx.fillStyle = '#fde8e8';
    ctx.fillRect(-2, -10, 4, 2);
  } else {
    ctx.fillRect(-3, -11, 6, 2);
  }

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

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(2, h / 2 + 4, h * 0.55, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const boxGrad = ctx.createLinearGradient(-h / 2, -h / 2, h / 2, h / 2);
  boxGrad.addColorStop(0, '#a35c0e');
  boxGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = boxGrad;
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(-h / 2, -h / 2, h, h, 2);
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.fillRect(-h / 2, -2, h, 4);
  ctx.fillRect(-2, -h / 2, 4, h);

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(-h / 2 + 4, -h / 2 + 4, h - 8, h - 8);

  ctx.fillStyle = '#374151';
  ctx.fillRect(-h / 2 + 6, -h / 2 + 7, h - 14, 2);
  ctx.fillRect(-h / 2 + 6, -h / 2 + 11, h - 18, 2);
  ctx.fillRect(-h / 2 + 6, -h / 2 + 15, h - 16, 2);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-h / 2, -h / 2, h, 2);

  if (pkg.onGround && !p.isCarrying) {
    ctx.strokeStyle = 'rgba(34,197,94,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(-h / 2 - 3, -h / 2 - 3, h + 6, h + 6, 4);
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

  ctx.fillStyle = '#222228';
  ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

  drawCity(ctx);

  const carrying = state.player.isCarrying;
  drawZone(ctx, state.pickupZone.x, state.pickupZone.y, state.pickupZone.pulseTimer, '#22c55e', 'PICKUP', !carrying);
  drawZone(ctx, state.deliveryZone.x, state.deliveryZone.y, state.deliveryZone.pulseTimer, '#ef4444', 'DELIVER', carrying);

  for (const car of state.cars) drawCar(ctx, car, state.currentStageIdx);

  for (const ped of state.pedestrians) drawPedestrian(ctx, ped);

  if (!state.player.isCarrying) drawPackage(ctx, state);

  drawPlayer(ctx, state, skin);

  if (state.player.isCarrying) drawPackage(ctx, state);

  drawEffects(ctx, state);
  drawVignette(ctx);

  ctx.restore();
}
