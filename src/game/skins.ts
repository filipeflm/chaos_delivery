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
    nameEn: 'The Intern',      namePt: 'O Estagiário',
    descEn: 'Day 1. No clue.',  descPt: 'Primeiro dia. Zero noção.',
    bodyColor: '#2563eb', accentColor: '#1d4ed8',
    headColor: '#f5cba7', capColor: '#1d4ed8', legsColor: '#1e3a5f', glowColor: '#60a5fa',
  },
  {
    id: 'red', emoji: '🍕', cost: 80,
    nameEn: 'Pizza Boy',       namePt: 'Pizza Boy',
    descEn: 'Wrong address. Again.', descPt: 'Endereço errado. De novo.',
    bodyColor: '#dc2626', accentColor: '#b91c1c',
    headColor: '#fde68a', capColor: '#92400e', legsColor: '#450a0a', glowColor: '#fb923c',
  },
  {
    id: 'green', emoji: '🤖', cost: 200,
    nameEn: 'Bot 3000',        namePt: 'Robô 3000',
    descEn: 'Programmed to be late.', descPt: 'Programado pra atrasar.',
    bodyColor: '#475569', accentColor: '#38bdf8',
    headColor: '#cbd5e1', capColor: '#1e293b', legsColor: '#0f172a', glowColor: '#38bdf8',
  },
  {
    id: 'purple', emoji: '👻', cost: 400,
    nameEn: 'Ghost Courier',   namePt: 'Fantasma Postal',
    descEn: "INSS doesn't know he exists.", descPt: 'Nem o INSS sabe que existe.',
    bodyColor: '#7c3aed', accentColor: '#6d28d9',
    headColor: '#ede9fe', capColor: '#4c1d95', legsColor: '#2e1065', glowColor: '#a78bfa',
  },
  {
    id: 'gold', emoji: '🦆', cost: 800,
    nameEn: 'Duck Mail',       namePt: 'Pato Correio',
    descEn: '"Quack" means "sign here".', descPt: '"Quack" quer dizer "assine aqui".',
    bodyColor: '#eab308', accentColor: '#f97316',
    headColor: '#fef9c3', capColor: '#f97316', legsColor: '#c2410c', glowColor: '#fef08a',
  },
  {
    id: 'chaos', emoji: '🤡', cost: 1500,
    nameEn: 'Clown Express',   namePt: 'Palhaço Expresso',
    descEn: 'Everything. On fire. Always.', descPt: 'Tudo. Em chamas. Sempre.',
    bodyColor: '#ec4899', accentColor: '#a855f7',
    headColor: '#fde68a', capColor: '#c026d3', legsColor: '#500724', glowColor: '#f0abfc',
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
  // Harder earning: score divided by 80 (was 40), smaller stage bonuses, slower time bonus
  const base = Math.floor(score / 80);
  const stageBonuses = [0, 5, 15, 30, 60];
  const stageBonus = stageBonuses[Math.min(stageIdx, stageBonuses.length - 1)];
  const timeBonus = Math.floor(timeElapsed / 20);
  // No upper cap — exceptional runs get properly rewarded
  return Math.max(1, base + stageBonus + timeBonus);
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
