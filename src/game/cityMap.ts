import { COLS, ROWS, ROAD_COLS, ROAD_ROWS, TILE } from './constants';

// Tile types
export const TILE_BUILDING = 0;
export const TILE_ROAD = 1;
export const TILE_PUDDLE = 2;
export const TILE_CROSSWALK = 3;

// Generate the city grid
function buildGrid(): number[][] {
  const grid: number[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < COLS; c++) {
      // Outer border = buildings
      if (r < 1 || r >= ROWS - 1 || c < 1 || c >= COLS - 1) {
        row.push(TILE_BUILDING);
      } else if ((ROAD_ROWS as readonly number[]).includes(r) || (ROAD_COLS as readonly number[]).includes(c)) {
        row.push(TILE_ROAD);
      } else {
        row.push(TILE_BUILDING);
      }
    }
    grid.push(row);
  }

  return grid;
}

export const CITY_GRID: number[][] = buildGrid();

/** Returns tile type at tile coords (col, row) */
export function getTile(col: number, row: number): number {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return TILE_BUILDING;
  return CITY_GRID[row][col];
}

/** Returns tile type at world pixel coords */
export function getTileAt(x: number, y: number): number {
  return getTile(Math.floor(x / TILE), Math.floor(y / TILE));
}

/** Is this world pixel position on a road? */
export function isRoadAt(x: number, y: number): boolean {
  const t = getTileAt(x, y);
  return t === TILE_ROAD || t === TILE_PUDDLE || t === TILE_CROSSWALK;
}

/** All road tile centers as {x, y} world coordinates */
export function getRoadTiles(): { col: number; row: number; x: number; y: number }[] {
  const tiles: { col: number; row: number; x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (CITY_GRID[r][c] !== TILE_BUILDING) {
        tiles.push({ col: c, row: r, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
      }
    }
  }
  return tiles;
}

/** Intersections – places where horizontal and vertical roads meet */
export function getIntersections(): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (const row of ROAD_ROWS) {
    for (const col of ROAD_COLS) {
      result.push({ x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 });
    }
  }
  return result;
}

/** Random road tile center (excluding very-edge tiles) */
export function randomRoadPos(rng: () => number): { x: number; y: number } {
  const tiles = getRoadTiles().filter(t => t.col > 1 && t.col < COLS - 2 && t.row > 1 && t.row < ROWS - 2);
  const t = tiles[Math.floor(rng() * tiles.length)];
  return { x: t.x, y: t.y };
}

/** Building color palette for visual variety */
const BUILDING_COLORS: Record<string, string> = {};

export function getBuildingColor(col: number, row: number): string {
  const key = `${col},${row}`;
  if (!BUILDING_COLORS[key]) {
    const palette = [
      '#e8d5c0', '#d4c5b5', '#c9b8a8', '#ddd0c0',
      '#b8c9d4', '#c8d8e4', '#b5ccd5', '#c0d4dd',
      '#c8e0c8', '#b8d0b8', '#c5d5c0', '#d0ddc8',
      '#e8c8c8', '#ddb8b8', '#d0c0c0', '#e0c8c8',
    ];
    // Deterministic based on position
    const hash = (col * 7 + row * 13) % palette.length;
    BUILDING_COLORS[key] = palette[hash];
  }
  return BUILDING_COLORS[key];
}
