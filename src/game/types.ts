export type GamePhase = 'playing' | 'paused' | 'gameover';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;          // facing direction in radians
  lives: number;
  isCarrying: boolean;
  invincible: boolean;
  invincibleTimer: number;
  // animation
  bobOffset: number;
  bobTimer: number;
  squashX: number;
  squashY: number;
}

export interface Package {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotVel: number;
  wobble: number;
  wobbleVel: number;
  onGround: boolean;
  groundTimer: number;  // how long on ground (for "in danger" glow)
}

export interface Zone {
  x: number;
  y: number;
  pulseTimer: number;
  label: string;
}

export type CarDirection = 'left' | 'right' | 'up' | 'down';

export interface Car {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  dir: CarDirection;
  lane: number;          // 0 = top/left lane, 1 = bottom/right lane
  honkTimer: number;
  honking: boolean;
}

export type PedState = 'walking' | 'waiting' | 'fleeing';

export interface Pedestrian {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  state: PedState;
  stateTimer: number;
  color: string;
  hatColor: string;
  bobTimer: number;
  variant: number;  // 0-3 visual variant
}

export interface Puddle {
  x: number;
  y: number;
  radius: number;
  animTimer: number;
}

export type EffectKind = 'particle' | 'floatText' | 'impact' | 'delivery';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // 0–1
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface Effects {
  particles: Particle[];
  floatTexts: FloatText[];
  shakeX: number;
  shakeY: number;
  shakeTimer: number;
  deliveryFlash: number;  // 0–1 overlay brightness
  screenFlashColor: string;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
  actionJustPressed: boolean;
  // touch joystick
  touchDx: number;
  touchDy: number;
}

export interface GameState {
  phase: GamePhase;
  player: Player;
  pkg: Package;
  pickupZone: Zone;
  deliveryZone: Zone;
  cars: Car[];
  pedestrians: Pedestrian[];
  puddles: Puddle[];
  effects: Effects;
  score: number;
  combo: number;
  bestCombo: number;
  deliveries: number;
  timeElapsed: number;
  deliveryTimer: number;
  carSpawnTimer: number;
  difficulty: number;
  currentStageIdx: number;   // index into DIFFICULTY_STAGES
  nextCarId: number;
  nextPedId: number;
  countdownTimer: number;
  chaosEventTimer: number;
  activeChaosEvent: string | null;
}

export interface ReactiveGameState {
  phase: GamePhase;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  deliveries: number;
  deliveryTimer: number;
  timeElapsed: number;
  currentStageIdx: number;
  isCarrying: boolean;
  nearPickup: boolean;
  nearDelivery: boolean;
  countdownTimer: number;
  activeChaosEvent: string | null;
}
