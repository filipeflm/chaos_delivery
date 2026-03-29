import {
  type GameState, type Player, type Package, type Zone, type CarDirection,
  type Pedestrian, type Puddle, type Effects, type InputState, type ReactiveGameState,
} from './types';
import {
  VIRTUAL_W, VIRTUAL_H, TILE, ROAD_COLS, ROAD_ROWS,
  PLAYER_SPEED, PLAYER_SPEED_CARRY, PLAYER_SIZE, PLAYER_LIVES, INVINCIBLE_DURATION,
  PKG_WOBBLE_SPEED_FACTOR, PKG_WOBBLE_DECAY, PICKUP_RANGE, DELIVER_RANGE,
  SCORE_BASE_DELIVERY, SCORE_TIME_BONUS_MAX, SCORE_COMBO_MULTIPLIER,
  CAR_W, CAR_H, CAR_SPEED_MIN, CAR_SPEED_MAX,
  PED_SPEED,
  PUDDLE_COUNT, SHAKE_INTENSITY, PARTICLE_COUNT, FLOAT_TEXT_DURATION,
  DIFFICULTY_STAGES,
} from './constants';
import { isRoadAt, randomRoadPos, getIntersections, getTileAt, TILE_PUDDLE } from './cityMap';

// ─── Helpers ────────────────────────────────────────────────────────────────

let _rngSeed = Date.now();
function rng(): number {
  _rngSeed = (_rngSeed * 1664525 + 1013904223) & 0xffffffff;
  return (_rngSeed >>> 0) / 0xffffffff;
}

function rngRange(min: number, max: number): number {
  return min + rng() * (max - min);
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function aabbOverlap(ax: number, ay: number, aw: number, ah: number,
                     bx: number, by: number, bw: number, bh: number): boolean {
  return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
}

function canMoveTo(x: number, y: number, half: number): boolean {
  const inset = 3;
  return (
    isRoadAt(x - half + inset, y - half + inset) &&
    isRoadAt(x + half - inset, y - half + inset) &&
    isRoadAt(x - half + inset, y + half - inset) &&
    isRoadAt(x + half - inset, y + half - inset)
  );
}

const CAR_COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#6a4c93', '#2dc653'];
const PED_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997'];
const PED_HAT_COLORS = ['#212529', '#495057', '#343a40', '#1864ab', '#5c2200', '#2b2d42'];

// ─── Factory functions ───────────────────────────────────────────────────────

function makePlayer(): Player {
  const startPos = { x: ROAD_COLS[1] * TILE + TILE / 2, y: ROAD_ROWS[1] * TILE + TILE / 2 };
  return {
    x: startPos.x,
    y: startPos.y,
    vx: 0,
    vy: 0,
    angle: 0,
    lives: PLAYER_LIVES,
    isCarrying: false,
    invincible: false,
    invincibleTimer: 0,
    bobOffset: 0,
    bobTimer: 0,
    squashX: 1,
    squashY: 1,
  };
}

function makePackage(x: number, y: number): Package {
  return { x, y, vx: 0, vy: 0, rotation: 0, rotVel: 0, wobble: 0, wobbleVel: 0, onGround: false, groundTimer: 0 };
}

function makeZones(excludePickup?: { x: number; y: number }): { pickup: Zone; delivery: Zone } {
  let px: number, py: number;
  let dx: number, dy: number;
  const intersections = getIntersections();
  const candidates = intersections.filter(p =>
    !excludePickup || dist(p.x, p.y, excludePickup.x, excludePickup.y) > TILE * 3
  );

  const pi = Math.floor(rng() * candidates.length);
  px = candidates[pi].x;
  py = candidates[pi].y;

  let di: number;
  do { di = Math.floor(rng() * intersections.length); } while (di === pi && intersections.length > 1);
  dx = intersections[di].x;
  dy = intersections[di].y;

  // Ensure delivery is at least 3 tiles away from pickup
  let attempts = 0;
  while (dist(px, py, dx, dy) < TILE * 4 && attempts++ < 20) {
    di = Math.floor(rng() * intersections.length);
    dx = intersections[di].x;
    dy = intersections[di].y;
  }

  return {
    pickup: { x: px, y: py, pulseTimer: 0, label: 'PICKUP' },
    delivery: { x: dx, y: dy, pulseTimer: 0, label: 'DELIVER' },
  };
}

function makePedestrians(count: number): Pedestrian[] {
  const peds: Pedestrian[] = [];
  const intersections = getIntersections();
  for (let i = 0; i < count; i++) {
    const pos = intersections[Math.floor(rng() * intersections.length)];
    const ci = Math.floor(rng() * PED_COLORS.length);
    peds.push({
      id: i,
      x: pos.x + rngRange(-8, 8),
      y: pos.y + rngRange(-8, 8),
      vx: 0, vy: 0,
      targetX: pos.x, targetY: pos.y,
      state: 'walking',
      stateTimer: rngRange(0.5, 2),
      color: PED_COLORS[ci],
      hatColor: PED_HAT_COLORS[Math.floor(rng() * PED_HAT_COLORS.length)],
      bobTimer: rng() * Math.PI * 2,
      variant: Math.floor(rng() * 4),
    });
  }
  return peds;
}

function makePuddles(): Puddle[] {
  const puddles: Puddle[] = [];
  for (let i = 0; i < PUDDLE_COUNT; i++) {
    const pos = randomRoadPos(rng);
    puddles.push({ x: pos.x, y: pos.y, radius: rngRange(20, 35), animTimer: rng() * Math.PI * 2 });
  }
  return puddles;
}

function makeEffects(): Effects {
  return {
    particles: [], floatTexts: [],
    shakeX: 0, shakeY: 0, shakeTimer: 0,
    deliveryFlash: 0, screenFlashColor: '#ffffff',
  };
}

// ─── Effects helpers ─────────────────────────────────────────────────────────

function addParticleBurst(eff: Effects, x: number, y: number, color: string, count = PARTICLE_COUNT): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
    const speed = rngRange(40, 140);
    const life = rngRange(0.4, 0.9);
    eff.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color, size: rngRange(3, 8) });
  }
}

function addFloatText(eff: Effects, x: number, y: number, text: string, color: string, scale = 1): void {
  eff.floatTexts.push({ x, y, text, color, life: FLOAT_TEXT_DURATION, maxLife: FLOAT_TEXT_DURATION, scale });
}

function triggerShake(eff: Effects, intensity = SHAKE_INTENSITY): void {
  eff.shakeTimer = 0.4;
  eff.shakeX = (rng() - 0.5) * intensity * 2;
  eff.shakeY = (rng() - 0.5) * intensity * 2;
}

// ─── Car spawning ────────────────────────────────────────────────────────────

function spawnCar(state: GameState): void {
  const stage = DIFFICULTY_STAGES[state.currentStageIdx];
  const speedMin = CAR_SPEED_MIN * stage.carSpeedMult;
  const speedMax = CAR_SPEED_MAX * stage.carSpeedMult;

  const useHorizontal = rng() > 0.5;
  let x: number, y: number, vx: number, vy: number, dir: CarDirection, lane: number;

  if (useHorizontal) {
    const rowIdx = Math.floor(rng() * ROAD_ROWS.length);
    const row = ROAD_ROWS[rowIdx];
    lane = rng() > 0.5 ? 0 : 1;
    const goRight = rng() > 0.5;
    const speed = rngRange(speedMin, speedMax);
    y = row * TILE + TILE / 2 + (lane === 0 ? -7 : 7);
    if (goRight) {
      x = -CAR_W; vx = speed; vy = 0; dir = 'right';
    } else {
      x = VIRTUAL_W + CAR_W; vx = -speed; vy = 0; dir = 'left';
    }
  } else {
    const colIdx = Math.floor(rng() * ROAD_COLS.length);
    const col = ROAD_COLS[colIdx];
    lane = rng() > 0.5 ? 0 : 1;
    const goDown = rng() > 0.5;
    const speed = rngRange(speedMin, speedMax);
    x = col * TILE + TILE / 2 + (lane === 0 ? -7 : 7);
    if (goDown) {
      y = -CAR_H; vx = 0; vy = speed; dir = 'down';
    } else {
      y = VIRTUAL_H + CAR_H; vx = 0; vy = -speed; dir = 'up';
    }
  }

  const ci = Math.floor(rng() * CAR_COLORS.length);
  const base = CAR_COLORS[ci];

  state.cars.push({
    id: state.nextCarId++,
    x, y, vx, vy,
    width: useHorizontal ? CAR_W : CAR_H,
    height: useHorizontal ? CAR_H : CAR_W,
    color: base,
    roofColor: base,
    dir, lane,
    honkTimer: 0, honking: false,
  });
}

// ─── Update functions ────────────────────────────────────────────────────────

function updatePlayer(state: GameState, input: InputState, dt: number): void {
  const p = state.player;

  // Invincibility countdown
  if (p.invincible) {
    p.invincibleTimer -= dt;
    if (p.invincibleTimer <= 0) { p.invincible = false; }
  }

  // Determine target velocity from input
  let ix = 0, iy = 0;
  if (input.left || input.touchDx < -0.2) ix = -1;
  if (input.right || input.touchDx > 0.2) ix = 1;
  if (input.up || input.touchDy < -0.2) iy = -1;
  if (input.down || input.touchDy > 0.2) iy = 1;

  // Normalize diagonal
  const mag = Math.sqrt(ix * ix + iy * iy);
  if (mag > 1) { ix /= mag; iy /= mag; }

  // Check if on puddle
  const onPuddle = getTileAt(p.x, p.y) === TILE_PUDDLE;
  const friction = onPuddle ? 0.15 : 10;
  const maxSpeed = (p.isCarrying ? PLAYER_SPEED_CARRY : PLAYER_SPEED) * (onPuddle ? 0.6 : 1);

  p.vx += (ix * maxSpeed - p.vx) * Math.min(friction * dt, 1);
  p.vy += (iy * maxSpeed - p.vy) * Math.min(friction * dt, 1);

  // Apply movement with tile collision
  const half = PLAYER_SIZE / 2;
  const newX = p.x + p.vx * dt;
  if (canMoveTo(newX, p.y, half)) { p.x = newX; } else { p.vx = 0; }
  const newY = p.y + p.vy * dt;
  if (canMoveTo(p.x, newY, half)) { p.y = newY; } else { p.vy = 0; }

  // Facing angle
  const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  if (speed > 20) {
    p.angle = Math.atan2(p.vy, p.vx) - Math.PI / 2;
  }

  // Bob animation
  p.bobTimer += speed * dt * 0.025;
  p.bobOffset = speed > 20 ? Math.sin(p.bobTimer) * 2.5 : 0;

  // Squash & stretch
  const targetSX = 1 + speed * 0.0008;
  const targetSY = 1 - speed * 0.0006;
  p.squashX += (targetSX - p.squashX) * 10 * dt;
  p.squashY += (targetSY - p.squashY) * 10 * dt;
}

function updatePackage(state: GameState, dt: number): void {
  const pkg = state.pkg;
  const player = state.player;

  if (player.isCarrying) {
    // Carried: follow player with slight lag for wobble feel
    const targetX = player.x;
    const targetY = player.y - PLAYER_SIZE * 0.6;
    const spring = 14;
    pkg.vx += (targetX - pkg.x) * spring * dt;
    pkg.vy += (targetY - pkg.y) * spring * dt;
    pkg.vx *= (1 - 8 * dt);
    pkg.vy *= (1 - 8 * dt);
    pkg.x += pkg.vx * dt;
    pkg.y += pkg.vy * dt;

    // Wobble based on player velocity change
    const playerSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
    pkg.wobbleVel += (playerSpeed * PKG_WOBBLE_SPEED_FACTOR - pkg.wobble) * 4 * dt;
    pkg.wobble += pkg.wobbleVel * dt;
    pkg.wobbleVel -= pkg.wobble * PKG_WOBBLE_DECAY * dt;
    pkg.rotVel += (Math.sin(pkg.wobble * 0.5) * 2 - pkg.rotVel) * 5 * dt;
    pkg.rotation += pkg.rotVel * dt;
    pkg.onGround = false;
  } else {
    // On ground: slide to a stop
    const friction = 4;
    pkg.vx *= (1 - friction * dt);
    pkg.vy *= (1 - friction * dt);

    const newX = pkg.x + pkg.vx * dt;
    if (isRoadAt(newX, pkg.y)) { pkg.x = newX; } else { pkg.vx *= -0.5; }
    const newY = pkg.y + pkg.vy * dt;
    if (isRoadAt(pkg.x, newY)) { pkg.y = newY; } else { pkg.vy *= -0.5; }

    pkg.rotVel *= (1 - 3 * dt);
    pkg.rotation += pkg.rotVel * dt;
    pkg.wobble *= (1 - 4 * dt);
    pkg.onGround = true;
    pkg.groundTimer += dt;
  }
}

function updateCars(state: GameState, dt: number): void {
  const stage = DIFFICULTY_STAGES[state.currentStageIdx];

  // Spawn — respect the stage's max cars cap
  state.carSpawnTimer -= dt;
  if (state.carSpawnTimer <= 0) {
    if (state.cars.length < stage.maxCars) {
      spawnCar(state);
    }
    state.carSpawnTimer = stage.carSpawnInterval;
  }

  // Move & cull
  state.cars = state.cars.filter(car => {
    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // Check honk near player
    const d = dist(car.x, car.y, state.player.x, state.player.y);
    if (d < 80 && !car.honking) { car.honking = true; car.honkTimer = 0.5; }
    if (car.honkTimer > 0) car.honkTimer -= dt;
    if (car.honkTimer <= 0) car.honking = false;

    // Despawn off-screen
    const pad = 80;
    return car.x > -pad && car.x < VIRTUAL_W + pad && car.y > -pad && car.y < VIRTUAL_H + pad;
  });
}

function updatePedestrians(state: GameState, dt: number): void {
  const intersections = getIntersections();

  for (const ped of state.pedestrians) {
    ped.bobTimer += dt * 3;
    ped.stateTimer -= dt;

    // Flee if player is near
    const d = dist(ped.x, ped.y, state.player.x, state.player.y);
    if (d < 50 && ped.state !== 'fleeing') {
      ped.state = 'fleeing';
      ped.stateTimer = 1.5;
    // direction away from player is implicit in choosing a random far intersection
      const target = intersections[Math.floor(rng() * intersections.length)];
      ped.targetX = target.x;
      ped.targetY = target.y;
    }

    if (ped.stateTimer <= 0) {
      // Pick new waypoint
      const target = intersections[Math.floor(rng() * intersections.length)];
      ped.targetX = target.x;
      ped.targetY = target.y;
      ped.state = rng() > 0.3 ? 'walking' : 'waiting';
      ped.stateTimer = rngRange(1, 3);
    }

    if (ped.state !== 'waiting') {
      const dx = ped.targetX - ped.x;
      const dy = ped.targetY - ped.y;
      const d2 = Math.sqrt(dx * dx + dy * dy);
      if (d2 > 8) {
        const speed = ped.state === 'fleeing' ? PED_SPEED * 1.8 : PED_SPEED;
        ped.vx += (dx / d2 * speed - ped.vx) * 8 * dt;
        ped.vy += (dy / d2 * speed - ped.vy) * 8 * dt;
      } else {
        ped.vx *= 1 - 6 * dt;
        ped.vy *= 1 - 6 * dt;
      }
    } else {
      ped.vx *= 1 - 8 * dt;
      ped.vy *= 1 - 8 * dt;
    }

    // Move with tile collision
    const newX = ped.x + ped.vx * dt;
    if (isRoadAt(newX, ped.y)) ped.x = newX; else ped.vx *= -0.5;
    const newY = ped.y + ped.vy * dt;
    if (isRoadAt(ped.x, newY)) ped.y = newY; else ped.vy *= -0.5;
  }
}

function checkCollisions(state: GameState): void {
  const p = state.player;
  if (p.invincible) return;

  // Player vs Cars
  for (const car of state.cars) {
    if (aabbOverlap(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, car.x, car.y, car.width, car.height)) {
      hitPlayer(state);
      return;
    }
  }
}

function hitPlayer(state: GameState): void {
  const p = state.player;
  p.lives--;
  p.invincible = true;
  p.invincibleTimer = INVINCIBLE_DURATION;

  // Drop package
  if (p.isCarrying) {
    p.isCarrying = false;
    state.pkg.vx = (rng() - 0.5) * 180;
    state.pkg.vy = (rng() - 0.5) * 180;
    state.pkg.rotVel = (rng() - 0.5) * 8;
    state.pkg.onGround = false;
    addFloatText(state.effects, p.x, p.y - 30, 'Dropped!', '#f59e0b');
  }

  triggerShake(state.effects, SHAKE_INTENSITY * 1.5);
  addParticleBurst(state.effects, p.x, p.y, '#ef4444', 8);
  addFloatText(state.effects, p.x, p.y - 20, 'OUCH!', '#ef4444', 1.3);

  if (p.lives <= 0) {
    state.phase = 'gameover';
  }
}

function checkPickupDelivery(state: GameState, input: InputState): void {
  if (!input.actionJustPressed) return;
  const p = state.player;

  if (!p.isCarrying) {
    // Try to pick up from pickup zone
    if (dist(p.x, p.y, state.pickupZone.x, state.pickupZone.y) < PICKUP_RANGE) {
      p.isCarrying = true;
      state.pkg.x = state.pickupZone.x;
      state.pkg.y = state.pickupZone.y;
      state.pkg.vx = 0; state.pkg.vy = 0;
      state.pkg.rotation = 0; state.pkg.rotVel = 0;
      state.pkg.groundTimer = 0;
      addFloatText(state.effects, p.x, p.y - 40, 'Got it!', '#22c55e');
      addParticleBurst(state.effects, state.pickupZone.x, state.pickupZone.y, '#22c55e', 8);
      return;
    }
    // Pick up dropped package from ground
    if (!state.pkg.onGround) return;
    if (dist(p.x, p.y, state.pkg.x, state.pkg.y) < PICKUP_RANGE) {
      p.isCarrying = true;
      state.pkg.vx = 0; state.pkg.vy = 0;
      state.pkg.rotVel = 0;
      addFloatText(state.effects, p.x, p.y - 40, 'Got it!', '#22c55e');
    }
    return;
  }

  // Deliver
  if (dist(p.x, p.y, state.deliveryZone.x, state.deliveryZone.y) < DELIVER_RANGE) {
    deliverPackage(state);
  }
}

function deliverPackage(state: GameState): void {
  const p = state.player;
  const stage = DIFFICULTY_STAGES[state.currentStageIdx];
  p.isCarrying = false;
  state.deliveries++;
  state.combo++;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;

  // Score calculation — time bonus relative to current stage's limit
  const timeRatio = Math.max(0, state.deliveryTimer) / stage.deliveryTimeLimit;
  const timeBonus = Math.round(timeRatio * SCORE_TIME_BONUS_MAX);
  const comboMult = 1 + (state.combo - 1) * SCORE_COMBO_MULTIPLIER;
  // Stage multiplier makes later deliveries worth more
  const stageMult = 1 + state.currentStageIdx * 0.6;
  const points = Math.round((SCORE_BASE_DELIVERY + timeBonus) * comboMult * stageMult);
  state.score += points;

  // Quality feedback
  const color = timeRatio > 0.6 ? '#fbbf24' : timeRatio > 0.35 ? '#4ade80' : '#60a5fa';
  const label = timeRatio > 0.6 ? 'PERFECT!' : timeRatio > 0.35 ? 'GREAT!' : 'GOOD!';

  addFloatText(state.effects, state.deliveryZone.x, state.deliveryZone.y - 30, `+${points}`, '#fbbf24', 1.6);
  addFloatText(state.effects, state.deliveryZone.x, state.deliveryZone.y - 60, label, color, 1.3);
  if (state.combo > 1) {
    addFloatText(state.effects, state.deliveryZone.x + 30, state.deliveryZone.y - 45, `x${state.combo} COMBO!`, '#f472b6', 1.1);
  }
  addParticleBurst(state.effects, state.deliveryZone.x, state.deliveryZone.y, '#fbbf24', 20);
  triggerShake(state.effects, 3);
  state.effects.deliveryFlash = 1.0;

  // New zones and reset delivery timer using current stage limit
  const { pickup, delivery } = makeZones({ x: state.deliveryZone.x, y: state.deliveryZone.y });
  state.pickupZone = pickup;
  state.deliveryZone = delivery;
  state.deliveryTimer = stage.deliveryTimeLimit;

  state.pkg.x = pickup.x;
  state.pkg.y = pickup.y;
  state.pkg.vx = 0; state.pkg.vy = 0;
  state.pkg.onGround = true;
  state.pkg.groundTimer = 0;
}

function updateEffects(state: GameState, dt: number): void {
  const eff = state.effects;

  // Screen shake
  if (eff.shakeTimer > 0) {
    eff.shakeTimer -= dt;
    const intensity = (eff.shakeTimer / 0.4) * SHAKE_INTENSITY;
    eff.shakeX = (rng() - 0.5) * intensity * 2;
    eff.shakeY = (rng() - 0.5) * intensity * 2;
  } else {
    eff.shakeX = 0; eff.shakeY = 0;
  }

  // Delivery flash fade
  eff.deliveryFlash = Math.max(0, eff.deliveryFlash - dt * 3);

  // Particles
  eff.particles = eff.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - 3 * dt;
    p.vy *= 1 - 3 * dt;
    p.vy += 80 * dt; // gravity
    p.life -= dt;
    return p.life > 0;
  });

  // Float texts
  eff.floatTexts = eff.floatTexts.filter(ft => {
    ft.y -= 45 * dt;
    ft.life -= dt;
    return ft.life > 0;
  });

  // Zone pulse timers
  state.pickupZone.pulseTimer += dt * 2.5;
  state.deliveryZone.pulseTimer += dt * 2.5;

  // Puddle animation
  for (const puddle of state.puddles) {
    puddle.animTimer += dt;
  }
}

function updateDeliveryTimer(state: GameState, dt: number): void {
  if (state.countdownTimer > 0) return;
  state.deliveryTimer -= dt;
  if (state.deliveryTimer <= 0) {
    state.combo = 0;
    const stage = DIFFICULTY_STAGES[state.currentStageIdx];
    state.deliveryTimer = stage.deliveryTimeLimit;
    addFloatText(state.effects, VIRTUAL_W / 2, VIRTUAL_H / 2 - 30, 'TIME\'S UP!', '#ef4444', 1.4);
    triggerShake(state.effects, 5);
    state.player.lives = Math.max(0, state.player.lives - 1);
    if (state.player.lives <= 0) {
      state.phase = 'gameover';
    }
  }
}

// ─── Time-based difficulty progression ───────────────────────────────────────

function updateDifficultyStage(state: GameState, lang: string): void {
  const t = state.timeElapsed;
  let newStage = 0;
  for (let i = DIFFICULTY_STAGES.length - 1; i >= 0; i--) {
    if (t >= DIFFICULTY_STAGES[i].timeThreshold) { newStage = i; break; }
  }

  if (newStage > state.currentStageIdx) {
    state.currentStageIdx = newStage;
    const stage = DIFFICULTY_STAGES[newStage];
    const label = lang === 'pt' ? stage.labelPt : stage.label;

    // Announce stage change
    addFloatText(state.effects, VIRTUAL_W / 2, VIRTUAL_H / 2 - 20, `⚡ ${label}`, stage.color, 1.5);
    triggerShake(state.effects, SHAKE_INTENSITY * 1.8);
    addParticleBurst(state.effects, VIRTUAL_W / 2, VIRTUAL_H / 2, stage.color, 20);
    state.effects.deliveryFlash = 0.6;

    // Spawn extra pedestrians for this stage
    const targetPeds = stage.pedCount;
    while (state.pedestrians.length < targetPeds) {
      const newPeds = makePedestrians(1);
      newPeds[0].id = state.nextPedId++;
      state.pedestrians.push(newPeds[0]);
    }

    // Spawn a burst of cars for dramatic effect
    const carBurst = Math.min(2, stage.maxCars - state.cars.length);
    for (let i = 0; i < carBurst; i++) spawnCar(state);
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): GameState {
  _rngSeed = Date.now();
  const player = makePlayer();
  const { pickup, delivery } = makeZones();
  const pkg = makePackage(pickup.x, pickup.y);
  pkg.onGround = true;
  const stage0 = DIFFICULTY_STAGES[0];

  return {
    phase: 'playing',
    player,
    pkg,
    pickupZone: pickup,
    deliveryZone: delivery,
    cars: [],
    pedestrians: makePedestrians(stage0.pedCount),
    puddles: makePuddles(),
    effects: makeEffects(),
    score: 0,
    combo: 0,
    bestCombo: 0,
    deliveries: 0,
    timeElapsed: 0,
    deliveryTimer: stage0.deliveryTimeLimit,
    carSpawnTimer: 2.0,
    difficulty: 0,
    currentStageIdx: 0,
    nextCarId: 0,
    nextPedId: 100,
    countdownTimer: 0,
    chaosEventTimer: rngRange(stage0.windInterval * 0.8, stage0.windInterval * 1.2),
    activeChaosEvent: null,
  };
}

function getReactiveState(state: GameState, nearPickup: boolean, nearDelivery: boolean): ReactiveGameState {
  return {
    phase: state.phase,
    score: state.score,
    lives: state.player.lives,
    combo: state.combo,
    bestCombo: state.bestCombo,
    deliveries: state.deliveries,
    deliveryTimer: state.deliveryTimer,
    timeElapsed: state.timeElapsed,
    currentStageIdx: state.currentStageIdx,
    isCarrying: state.player.isCarrying,
    nearPickup,
    nearDelivery,
    countdownTimer: state.countdownTimer,
    activeChaosEvent: state.activeChaosEvent,
  };
}

export class GameEngine {
  private state: GameState;
  private onStateChange: (s: ReactiveGameState) => void;
  private lang: string = 'en';

  constructor(onStateChange: (s: ReactiveGameState) => void) {
    this.state = createInitialState();
    this.onStateChange = onStateChange;
  }

  setLang(lang: string): void { this.lang = lang; }

  restart(): void {
    this.state = createInitialState();
    this.notifyReactive();
  }

  pause(): void {
    if (this.state.phase === 'playing') this.state.phase = 'paused';
    this.notifyReactive();
  }

  resume(): void {
    if (this.state.phase === 'paused') this.state.phase = 'playing';
    this.notifyReactive();
  }

  update(dt: number, input: InputState): void {
    const s = this.state;
    if (s.phase !== 'playing') return;

    const cdt = Math.min(dt, 0.05);

    if (s.countdownTimer > 0) {
      s.countdownTimer -= cdt;
      return;
    }

    s.timeElapsed += cdt;

    // ── Passive time-based score (scales with stage) ──────────────────────
    const stage = DIFFICULTY_STAGES[s.currentStageIdx];
    s.score += stage.scorePerSecond * cdt;

    // ── Stage progression ─────────────────────────────────────────────────
    updateDifficultyStage(s, this.lang);

    // ── Entity updates ────────────────────────────────────────────────────
    updatePlayer(s, input, cdt);
    updatePackage(s, cdt);
    updateCars(s, cdt);
    updatePedestrians(s, cdt);
    checkCollisions(s);
    checkPickupDelivery(s, input);
    updateDeliveryTimer(s, cdt);
    updateEffects(s, cdt);

    // ── Wind / chaos events (interval comes from stage) ───────────────────
    s.chaosEventTimer -= cdt;
    if (s.chaosEventTimer <= 0 && s.activeChaosEvent === null) {
      s.activeChaosEvent = 'wind';
      const windStage = DIFFICULTY_STAGES[s.currentStageIdx];
      s.chaosEventTimer = rngRange(windStage.windInterval * 0.7, windStage.windInterval * 1.3);

      const windAngle = rng() * Math.PI * 2;
      // Wind force increases with stage
      const windForce = 100 + s.currentStageIdx * 40;
      s.player.vx += Math.cos(windAngle) * windForce;
      s.player.vy += Math.sin(windAngle) * windForce;
      if (s.player.isCarrying) {
        s.pkg.wobbleVel += 3 + s.currentStageIdx;
        s.pkg.rotVel += (rng() - 0.5) * (6 + s.currentStageIdx * 2);
      }
      addFloatText(s.effects, VIRTUAL_W / 2, VIRTUAL_H / 3, '💨 WIND!', '#93c5fd', 1.2 + s.currentStageIdx * 0.1);
      setTimeout(() => { s.activeChaosEvent = null; }, 2000);
    }

    const nearPickup = !s.player.isCarrying && dist(s.player.x, s.player.y, s.pickupZone.x, s.pickupZone.y) < PICKUP_RANGE * 1.3;
    const nearDelivery = s.player.isCarrying && dist(s.player.x, s.player.y, s.deliveryZone.x, s.deliveryZone.y) < DELIVER_RANGE * 1.3;
    this.onStateChange(getReactiveState(s, nearPickup, nearDelivery));
  }

  getState(): GameState {
    return this.state;
  }

  private notifyReactive(): void {
    const s = this.state;
    const nearPickup = !s.player.isCarrying && dist(s.player.x, s.player.y, s.pickupZone.x, s.pickupZone.y) < PICKUP_RANGE * 1.3;
    const nearDelivery = s.player.isCarrying && dist(s.player.x, s.player.y, s.deliveryZone.x, s.deliveryZone.y) < DELIVER_RANGE * 1.3;
    this.onStateChange(getReactiveState(s, nearPickup, nearDelivery));
  }
}
