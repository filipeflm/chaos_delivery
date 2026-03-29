// Virtual resolution – all game coords live in this space
export const VIRTUAL_W = 800;
export const VIRTUAL_H = 560;

// Tile
export const TILE = 40;
export const COLS = VIRTUAL_W / TILE; // 20
export const ROWS = VIRTUAL_H / TILE; // 14

// Road topology
export const ROAD_COLS = [2, 7, 12, 17] as const;
export const ROAD_ROWS = [2, 6, 10] as const;

// Player
export const PLAYER_SPEED = 168;
export const PLAYER_SPEED_CARRY = 130;
export const PLAYER_SIZE = 22;
export const PLAYER_LIVES = 3;
export const INVINCIBLE_DURATION = 2.0;

// Package
export const PACKAGE_SIZE = 20;
export const PKG_WOBBLE_DECAY = 6;
export const PKG_WOBBLE_SPEED_FACTOR = 0.018;
export const PICKUP_RANGE = 32;
export const DELIVER_RANGE = 36;

// Delivery scoring
export const SCORE_BASE_DELIVERY = 150;
export const SCORE_TIME_BONUS_MAX = 250;
export const SCORE_COMBO_MULTIPLIER = 0.5;

// Car
export const CAR_W = 34;
export const CAR_H = 20;
export const CAR_SPEED_MIN = 90;
export const CAR_SPEED_MAX = 200;

// Pedestrian
export const PED_RADIUS = 11;
export const PED_SPEED = 55;

// Puddle constant removed

// Effects
export const SHAKE_INTENSITY = 6;
export const SHAKE_DECAY = 8;
export const FLOAT_TEXT_DURATION = 1.4;
export const PARTICLE_COUNT = 12;

// ─── Difficulty stages (time-based) ──────────────────────────────────────────
// The game gets progressively harder over time. Each stage describes
// the parameters for that phase of the game.
export interface DifficultyStage {
  timeThreshold: number;  // seconds from game start to enter this stage
  label: string;          // English display name
  labelPt: string;        // Portuguese display name
  color: string;          // accent colour for announcements
  carSpawnInterval: number; // seconds between car spawns
  carSpeedMult: number;     // multiplier applied to CAR_SPEED_MIN/MAX
  maxCars: number;          // cap on simultaneous cars on screen
  pedCount: number;         // target pedestrian population
  windInterval: number;     // seconds between wind gusts
  scorePerSecond: number;   // passive score earned per second alive
  deliveryTimeLimit: number;// seconds to complete each delivery
}

export const DIFFICULTY_STAGES: DifficultyStage[] = [
  {
    timeThreshold: 0,
    label: 'Easy', labelPt: 'Fácil', color: '#4ade80',
    carSpawnInterval: 3.2, carSpeedMult: 1.0,  maxCars: 4,  pedCount: 3, windInterval: 32, scorePerSecond: 1,  deliveryTimeLimit: 28,
  },
  {
    timeThreshold: 15,
    label: 'Getting Busy', labelPt: 'Esquentando', color: '#fbbf24',
    carSpawnInterval: 2.2, carSpeedMult: 1.45, maxCars: 6,  pedCount: 5, windInterval: 22, scorePerSecond: 3,  deliveryTimeLimit: 24,
  },
  {
    timeThreshold: 35,
    label: '🔥 CHAOS', labelPt: '🔥 CAOS', color: '#f97316',
    carSpawnInterval: 1.5, carSpeedMult: 1.9,  maxCars: 9,  pedCount: 6, windInterval: 14, scorePerSecond: 7,  deliveryTimeLimit: 20,
  },
  {
    timeThreshold: 65,
    label: '💥 MAYHEM', labelPt: '💥 PANDÊMÔNIO', color: '#ef4444',
    carSpawnInterval: 0.9, carSpeedMult: 2.5,  maxCars: 12, pedCount: 8, windInterval: 9,  scorePerSecond: 14, deliveryTimeLimit: 16,
  },
  {
    timeThreshold: 100,
    label: '☠️ UNHINGED', labelPt: '☠️ INSANIDADE', color: '#a855f7',
    carSpawnInterval: 0.5, carSpeedMult: 3.2,  maxCars: 18, pedCount: 8, windInterval: 5,  scorePerSecond: 25, deliveryTimeLimit: 12,
  },
];

