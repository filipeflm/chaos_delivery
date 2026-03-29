// ─── Skin definitions ─────────────────────────────────────────────────────────

export interface Skin {
  id: string;
  nameEn: string;
  namePt: string;
  emoji: string;
  descEn: string;
  descPt: string;
  cost: number;           // 0 = always unlocked
  bodyColor: string;
  accentColor: string;
  headColor: string;
  capColor: string;
  legsColor: string;
  glowColor: string;      // hat / UI accent
}

export const SKINS: Skin[] = [
  {
    id: 'classic', emoji: '📦', cost: 0,
    nameEn: 'Classic',       namePt: 'Clássico',
    descEn: 'The original.',  descPt: 'O original.',
    bodyColor: '#2563eb', accentColor: '#1d4ed8',
    headColor: '#f5cba7', capColor: '#1d4ed8', legsColor: '#1e3a5f', glowColor: '#60a5fa',
  },
  {
    id: 'red', emoji: '🚀', cost: 80,
    nameEn: 'Red Rocket',    namePt: 'Foguete Vermelho',
    descEn: 'Speed freak.',   descPt: 'Viciado em velocidade.',
    bodyColor: '#dc2626', accentColor: '#b91c1c',
    headColor: '#fbbf24', capColor: '#7f1d1d', legsColor: '#450a0a', glowColor: '#f87171',
  },
  {
    id: 'green', emoji: '🌿', cost: 200,
    nameEn: 'Eco Rider',     namePt: 'Eco Rider',
    descEn: 'Zero emissions.', descPt: 'Zero emissões.',
    bodyColor: '#16a34a', accentColor: '#15803d',
    headColor: '#d1fae5', capColor: '#14532d', legsColor: '#052e16', glowColor: '#4ade80',
  },
  {
    id: 'purple', emoji: '👻', cost: 400,
    nameEn: 'Night Ghost',   namePt: 'Fantasma da Noite',
    descEn: 'Unseen. Unstoppable.', descPt: 'Invisível. Imparável.',
    bodyColor: '#7c3aed', accentColor: '#6d28d9',
    headColor: '#ede9fe', capColor: '#4c1d95', legsColor: '#2e1065', glowColor: '#a78bfa',
  },
  {
    id: 'gold', emoji: '👑', cost: 800,
    nameEn: 'Gold Champion', namePt: 'Campeão de Ouro',
    descEn: 'Only the best.', descPt: 'Só os melhores.',
    bodyColor: '#d97706', accentColor: '#b45309',
    headColor: '#fef3c7', capColor: '#78350f', legsColor: '#451a03', glowColor: '#fbbf24',
  },
  {
    id: 'chaos', emoji: '🌈', cost: 1500,
    nameEn: 'Chaos Mode',    namePt: 'Modo Caos',
    descEn: 'Absolute mayhem.', descPt: 'Caos absoluto.',
    bodyColor: '#ec4899', accentColor: '#db2777',
    headColor: '#fef9c3', capColor: '#831843', legsColor: '#500724', glowColor: '#f0abfc',
  },
];

export function getSkin(id: string): Skin {
  return SKINS.find(s => s.id === id) ?? SKINS[0];
}

// ─── Trophy / wallet persistence ─────────────────────────────────────────────

export interface TrophyData {
  trophies: number;           // current spendable balance
  totalEarned: number;        // lifetime trophies earned
  unlockedSkins: string[];    // skin ids the player owns
  activeSkin: string;
  highScore: number;
  bestTime: number;           // seconds
  gamesPlayed: number;
}

const STORAGE_KEY = 'doc_trophies_v2';

function defaultData(): TrophyData {
  return {
    trophies: 0, totalEarned: 0,
    unlockedSkins: ['classic'], activeSkin: 'classic',
    highScore: 0, bestTime: 0, gamesPlayed: 0,
  };
}

export function loadTrophyData(): TrophyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TrophyData>;
      return { ...defaultData(), ...parsed };
    }
  } catch { /* ignore */ }
  return defaultData();
}

export function saveTrophyData(data: TrophyData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Calculate trophies earned from a single game run */
export function calcTrophiesEarned(score: number, timeElapsed: number, stageIdx: number): number {
  const base = Math.floor(score / 40);
  const stageBonuses = [0, 8, 20, 40, 80];
  const stageBonus = stageBonuses[Math.min(stageIdx, stageBonuses.length - 1)];
  const timeBonus = Math.floor(timeElapsed / 15);
  return Math.max(1, Math.min(200, base + stageBonus + timeBonus));
}

/** Buy a skin, returns updated data or null if not enough trophies */
export function buySkin(data: TrophyData, skinId: string): TrophyData | null {
  const skin = getSkin(skinId);
  if (!skin || data.unlockedSkins.includes(skinId)) return null;
  if (data.trophies < skin.cost) return null;
  return {
    ...data,
    trophies: data.trophies - skin.cost,
    unlockedSkins: [...data.unlockedSkins, skinId],
    activeSkin: skinId,
  };
}

/** Set active skin, returns updated data */
export function setActiveSkin(data: TrophyData, skinId: string): TrophyData {
  if (!data.unlockedSkins.includes(skinId)) return data;
  return { ...data, activeSkin: skinId };
}
