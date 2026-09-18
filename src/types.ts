export type Direction = 1 | -1; // 1 = right, -1 = left

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  speed: number;
  isAlive: boolean;
  invulnerableTimer: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

export interface Mushroom {
  x: number; // grid col
  y: number; // grid row
  health: number; // 4 hits to destroy (4, 3, 2, 1)
  isPoisoned: boolean;
  regenerating?: boolean;
}

export interface CentipedeSegment {
  id: number;
  x: number; // grid col
  y: number; // grid row
  prevX?: number;
  prevY?: number;
  dirX: Direction;
  dirY: 1 | -1; // 1 = moving down, -1 = moving up (in player area)
  isHead: boolean;
  nextSegmentId?: number; // follower
  prevSegmentId?: number; // leader
  isDiving: boolean; // if poisoned, plunges straight down
  legAnimStep?: number;
  parentChainId?: number;
  orderInChain?: number;
}

export interface Spider {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  bouncePattern: number;
  animTimer: number;
}

export interface Flea {
  id: number;
  x: number;
  y: number;
  vy: number;
  health: number;
}

export interface Scorpion {
  id: number;
  x: number;
  y: number;
  dirX: Direction;
  speed: number;
  animTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

export interface WaveTheme {
  name: string;
  mushroomColor: string;
  mushroomAccent: string;
  poisonMushroomColor: string;
  centipedeHeadColor: string;
  centipedeBodyColor: string;
  spiderColor: string;
  fleaColor: string;
  scorpionColor: string;
}

export type ControlMode = 'keyboard' | 'mouse' | 'touch';

export interface GameSettings {
  soundEnabled: boolean;
  crtEffect: boolean;
  controlMode: ControlMode;
  autoFire: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  isPaused: boolean;
  waveCompleted: boolean;
}
