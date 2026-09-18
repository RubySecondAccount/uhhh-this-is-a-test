import { WaveTheme } from '../types';

export const GRID_COLS = 30;
export const GRID_ROWS = 32;
export const CELL_SIZE = 16;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE; // 480
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 512

export const PLAYER_ROW_MIN = 25; // Player cannot move above this row
export const PLAYER_ROW_MAX = 31; // Player bottom boundary
export const INITIAL_MUSHROOM_COUNT = 45;
export const MUSHROOM_MAX_HEALTH = 4;

export const BULLET_SPEED = 14;
export const PLAYER_SPEED = 3.6;

// Scoring
export const SCORE_CENTIPEDE_BODY = 10;
export const SCORE_CENTIPEDE_HEAD = 100;
export const SCORE_MUSHROOM_HIT = 1;
export const SCORE_MUSHROOM_KILL = 5;
export const SCORE_MUSHROOM_REGEN = 10;
export const SCORE_FLEA = 200;
export const SCORE_SCORPION = 1000;
export const SCORE_SPIDER_DISTANCES = {
  CLOSE: 900,
  MEDIUM: 600,
  FAR: 300,
};
export const EXTRA_LIFE_SCORE = 12000;

// Authentic retro palettes per wave
export const WAVE_THEMES: WaveTheme[] = [
  {
    name: 'Emerald Garden',
    mushroomColor: '#22c55e', // Green
    mushroomAccent: '#86efac',
    poisonMushroomColor: '#ec4899', // Bright Pink
    centipedeHeadColor: '#ef4444', // Red
    centipedeBodyColor: '#f97316', // Orange
    spiderColor: '#38bdf8', // Sky Blue
    fleaColor: '#facc15', // Yellow
    scorpionColor: '#a855f7', // Purple
  },
  {
    name: 'Neon Violet',
    mushroomColor: '#a855f7', // Purple
    mushroomAccent: '#d8b4fe',
    poisonMushroomColor: '#22c55e', // Neon Green
    centipedeHeadColor: '#eab308', // Yellow
    centipedeBodyColor: '#f59e0b', // Amber
    spiderColor: '#ec4899', // Pink
    fleaColor: '#06b6d4', // Cyan
    scorpionColor: '#ef4444', // Red
  },
  {
    name: 'Cyber Cyan',
    mushroomColor: '#06b6d4', // Cyan
    mushroomAccent: '#67e8f9',
    poisonMushroomColor: '#f97316', // Orange
    centipedeHeadColor: '#ec4899', // Magenta
    centipedeBodyColor: '#d946ef', // Fuchsia
    spiderColor: '#22c55e', // Green
    fleaColor: '#ef4444', // Red
    scorpionColor: '#facc15', // Yellow
  },
  {
    name: 'Molten Core',
    mushroomColor: '#f97316', // Orange
    mushroomAccent: '#fed7aa',
    poisonMushroomColor: '#38bdf8', // Light Blue
    centipedeHeadColor: '#22c55e', // Green
    centipedeBodyColor: '#84cc16', // Lime
    spiderColor: '#eab308', // Gold
    fleaColor: '#a855f7', // Violet
    scorpionColor: '#06b6d4', // Cyan
  },
  {
    name: 'Cobalt Night',
    mushroomColor: '#3b82f6', // Blue
    mushroomAccent: '#93c5fd',
    poisonMushroomColor: '#eab308', // Amber
    centipedeHeadColor: '#f43f5e', // Rose
    centipedeBodyColor: '#fb7185', // Soft Rose
    spiderColor: '#10b981', // Emerald
    fleaColor: '#f97316', // Orange
    scorpionColor: '#c084fc', // Lilac
  },
];
