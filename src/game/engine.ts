import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  PLAYER_ROW_MIN,
  PLAYER_ROW_MAX,
  INITIAL_MUSHROOM_COUNT,
  MUSHROOM_MAX_HEALTH,
  BULLET_SPEED,
  PLAYER_SPEED,
  SCORE_CENTIPEDE_BODY,
  SCORE_CENTIPEDE_HEAD,
  SCORE_MUSHROOM_HIT,
  SCORE_MUSHROOM_KILL,
  SCORE_MUSHROOM_REGEN,
  SCORE_FLEA,
  SCORE_SCORPION,
  SCORE_SPIDER_DISTANCES,
  EXTRA_LIFE_SCORE,
  WAVE_THEMES,
} from './constants';
import {
  Player,
  Bullet,
  Mushroom,
  CentipedeSegment,
  Spider,
  Flea,
  Scorpion,
  Particle,
  FloatingScore,
  WaveTheme,
  GameStats,
} from '../types';
import { sounds } from '../utils/audio';

export class GameEngine {
  public player: Player;
  public bullets: Bullet[] = [];
  public mushrooms: Map<string, Mushroom> = new Map();
  public centipedeSegments: CentipedeSegment[] = [];
  public spiders: Spider[] = [];
  public fleas: Flea[] = [];
  public scorpions: Scorpion[] = [];
  public particles: Particle[] = [];
  public floatingScores: FloatingScore[] = [];

  public stats: GameStats;
  public theme: WaveTheme = WAVE_THEMES[0];

  // Timing & Step ticks
  private nextEntityId: number = 1;
  private stepTimer: number = 0;
  private stepInterval: number = 6; // frames per centipede step
  private spiderSpawnTimer: number = 240;
  private fleaSpawnTimer: number = 600;
  private scorpionSpawnTimer: number = 800;
  private nextExtraLifeThreshold: number = EXTRA_LIFE_SCORE;
  private regeneratingMushrooms: Mushroom[] = [];
  private regenTimer: number = 0;

  // Input states
  public keys: { [key: string]: boolean } = {};
  public mouseTarget: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  public isFiring: boolean = false;
  private lastFireTime: number = 0;

  constructor(onStatsUpdate?: (stats: GameStats) => void) {
    this.player = this.createInitialPlayer();
    const storedHighScore = typeof window !== 'undefined' ? Number(localStorage.getItem('centipede_high_score') || 0) : 0;

    this.stats = {
      score: 0,
      highScore: storedHighScore,
      lives: 3,
      wave: 1,
      isGameOver: false,
      isPaused: false,
      waveCompleted: false,
    };

    this.startNewGame();
  }

  private createInitialPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2,
      y: (GRID_ROWS - 2) * CELL_SIZE,
      vx: 0,
      vy: 0,
      width: 14,
      height: 14,
      speed: PLAYER_SPEED,
      isAlive: true,
      invulnerableTimer: 60,
    };
  }

  public startNewGame() {
    this.stats.score = 0;
    this.stats.lives = 3;
    this.stats.wave = 1;
    this.stats.isGameOver = false;
    this.stats.isPaused = false;
    this.stats.waveCompleted = false;
    this.nextExtraLifeThreshold = EXTRA_LIFE_SCORE;

    this.mushrooms.clear();
    this.seedMushrooms(INITIAL_MUSHROOM_COUNT);
    this.startWave(1);
  }

  public startWave(waveNum: number) {
    this.stats.wave = waveNum;
    this.stats.waveCompleted = false;
    this.theme = WAVE_THEMES[(waveNum - 1) % WAVE_THEMES.length];

    this.bullets = [];
    this.spiders = [];
    this.fleas = [];
    this.scorpions = [];
    this.particles = [];
    this.floatingScores = [];

    // Respawn player
    this.player.x = CANVAS_WIDTH / 2;
    this.player.y = (GRID_ROWS - 2) * CELL_SIZE;
    this.player.isAlive = true;
    this.player.invulnerableTimer = 90;

    // Reset timers
    this.spiderSpawnTimer = 180 + Math.random() * 120;
    this.fleaSpawnTimer = 400 + Math.random() * 200;
    this.scorpionSpawnTimer = waveNum > 1 ? 500 + Math.random() * 300 : 999999;

    // Spawn Centipede
    this.spawnWaveCentipede(waveNum);
  }

  private seedMushrooms(count: number) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 1000) {
      attempts++;
      const col = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
      const row = Math.floor(Math.random() * (PLAYER_ROW_MIN - 3)) + 2; // avoid top 2 rows & player zone
      const key = `${col},${row}`;
      if (!this.mushrooms.has(key)) {
        this.mushrooms.set(key, {
          x: col,
          y: row,
          health: MUSHROOM_MAX_HEALTH,
          isPoisoned: false,
        });
        placed++;
      }
    }

    // Place a few mushrooms in player zone (3 to 5) for spider food
    for (let i = 0; i < 4; i++) {
      const col = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
      const row = Math.floor(Math.random() * (PLAYER_ROW_MAX - PLAYER_ROW_MIN)) + PLAYER_ROW_MIN;
      const key = `${col},${row}`;
      if (!this.mushrooms.has(key)) {
        this.mushrooms.set(key, {
          x: col,
          y: row,
          health: MUSHROOM_MAX_HEALTH,
          isPoisoned: false,
        });
      }
    }
  }

  private spawnWaveCentipede(wave: number) {
    this.centipedeSegments = [];
    // Base length is 12. In wave 1: 1 chain of 12.
    // In wave 2: 1 chain of 11 + 1 solo head.
    // In wave 3: 1 chain of 10 + 2 solo heads, etc.
    const soloHeads = Math.min(11, wave - 1);
    const mainChainLength = 12 - soloHeads;

    let chainId = 1;
    // Spawn main chain
    const startCol = Math.floor(GRID_COLS / 2);
    for (let i = 0; i < mainChainLength; i++) {
      const segCol = startCol - i;
      this.centipedeSegments.push({
        id: this.nextEntityId++,
        x: segCol,
        y: 0,
        prevX: segCol,
        prevY: 0,
        dirX: 1,
        dirY: 1,
        isHead: i === 0,
        isDiving: false,
        parentChainId: chainId,
        orderInChain: i,
      });
    }

    // Spawn detached solo heads
    for (let h = 0; h < soloHeads; h++) {
      chainId++;
      const col = (h * 4 + 2) % GRID_COLS;
      this.centipedeSegments.push({
        id: this.nextEntityId++,
        x: col,
        y: 0,
        prevX: col,
        prevY: 0,
        dirX: (h % 2 === 0 ? 1 : -1) as (1 | -1),
        dirY: 1,
        isHead: true,
        isDiving: false,
        parentChainId: chainId,
        orderInChain: 0,
      });
    }

    // Adjust step interval based on wave
    this.stepInterval = Math.max(3, 7 - Math.floor(wave * 0.4));
  }

  public update(timestamp: number) {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    // Handle mushroom regeneration after wave or player hit
    if (this.regeneratingMushrooms.length > 0) {
      this.updateMushroomRegeneration();
      return;
    }

    this.updatePlayer();
    this.updateBullets();
    this.updateCentipedes();
    this.updateSpiders();
    this.updateFleas();
    this.updateScorpions();
    this.updateParticles();
    this.updateFloatingScores();

    // Check wave complete
    if (this.centipedeSegments.length === 0 && !this.stats.waveCompleted) {
      this.handleWaveClear();
    }
  }

  private updatePlayer() {
    if (!this.player.isAlive) return;

    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer--;
    }

    // Keyboard movement
    let dx = 0;
    let dy = 0;

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      this.player.x += dx * this.player.speed;
      this.player.y += dy * this.player.speed;
    } else if (this.mouseTarget.active) {
      // Smoothly track mouse towards pointer
      const targetX = this.mouseTarget.x;
      const targetY = this.mouseTarget.y;
      const diffX = targetX - this.player.x;
      const diffY = targetY - this.player.y;
      const dist = Math.hypot(diffX, diffY);

      if (dist > 2) {
        const moveDist = Math.min(dist, this.player.speed * 1.5);
        this.player.x += (diffX / dist) * moveDist;
        this.player.y += (diffY / dist) * moveDist;
      }
    }

    // Boundary constraints
    const halfW = this.player.width / 2;
    const halfH = this.player.height / 2;
    const minPlayerY = PLAYER_ROW_MIN * CELL_SIZE + halfH;
    const maxPlayerY = PLAYER_ROW_MAX * CELL_SIZE + halfH;

    this.player.x = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, this.player.x));
    this.player.y = Math.max(minPlayerY, Math.min(maxPlayerY, this.player.y));

    // Handle firing (Single bullet or rapid fire)
    if (this.isFiring || this.keys['Space'] || this.keys['KeyZ']) {
      this.fireBullet();
    }
  }

  public fireBullet() {
    if (!this.player.isAlive || this.stats.isGameOver || this.stats.isPaused) return;

    // Single bullet on screen constraint (classic) with rapid responsiveness
    const activeCount = this.bullets.filter(b => b.active).length;
    if (activeCount >= 1) return;

    const now = Date.now();
    if (now - this.lastFireTime < 140) return;
    this.lastFireTime = now;

    this.bullets.push({
      id: this.nextEntityId++,
      x: this.player.x,
      y: this.player.y - 12,
      vy: -BULLET_SPEED,
      active: true,
    });

    sounds.playLaser();
  }

  private updateBullets() {
    for (const b of this.bullets) {
      if (!b.active) continue;

      b.y += b.vy;

      if (b.y < 0) {
        b.active = false;
        continue;
      }

      // Check collision with Mushrooms
      const cellX = Math.floor(b.x / CELL_SIZE);
      const cellY = Math.floor(b.y / CELL_SIZE);
      const mKey = `${cellX},${cellY}`;
      const mushroom = this.mushrooms.get(mKey);

      if (mushroom) {
        b.active = false;
        mushroom.health--;
        this.addScore(SCORE_MUSHROOM_HIT, b.x, b.y, false);

        if (mushroom.health <= 0) {
          this.mushrooms.delete(mKey);
          this.addScore(SCORE_MUSHROOM_KILL, b.x, b.y, false);
          sounds.playMushroomDestroyed();
          this.spawnExplosion(cellX * CELL_SIZE + 8, cellY * CELL_SIZE + 8, this.theme.mushroomColor, 8);
        } else {
          sounds.playMushroomHit();
          this.spawnExplosion(b.x, b.y, this.theme.mushroomAccent, 4);
        }
        continue;
      }

      // Check collision with Centipede Segments
      let hitSegmentIndex = -1;
      for (let i = 0; i < this.centipedeSegments.length; i++) {
        const seg = this.centipedeSegments[i];
        const segPixelX = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const segPixelY = seg.y * CELL_SIZE + CELL_SIZE / 2;

        if (Math.hypot(b.x - segPixelX, b.y - segPixelY) < 10) {
          hitSegmentIndex = i;
          break;
        }
      }

      if (hitSegmentIndex !== -1) {
        b.active = false;
        const hitSeg = this.centipedeSegments[hitSegmentIndex];

        // Award score
        const points = hitSeg.isHead ? SCORE_CENTIPEDE_HEAD : SCORE_CENTIPEDE_BODY;
        this.addScore(points, b.x, b.y, true);
        sounds.playCentipedeHit();
        this.spawnExplosion(b.x, b.y, hitSeg.isHead ? this.theme.centipedeHeadColor : this.theme.centipedeBodyColor, 12);

        // Turn this cell into a mushroom
        const mX = Math.round(hitSeg.x);
        const mY = Math.round(hitSeg.y);
        if (mY < GRID_ROWS && !this.mushrooms.has(`${mX},${mY}`)) {
          this.mushrooms.set(`${mX},${mY}`, {
            x: mX,
            y: mY,
            health: MUSHROOM_MAX_HEALTH,
            isPoisoned: false,
          });
        }

        // Split logic: Find any segment that followed this segment in the chain
        // If a segment had orderInChain == hitSeg.orderInChain + 1 in the same parentChain, it becomes a new Head!
        const hitOrder = hitSeg.orderInChain ?? 0;
        for (const seg of this.centipedeSegments) {
          if (seg.parentChainId === hitSeg.parentChainId && seg.orderInChain === hitOrder + 1) {
            seg.isHead = true;
            // Reverse direction for excitement
            seg.dirX = -seg.dirX as (1 | -1);
          }
        }

        // Remove the hit segment
        this.centipedeSegments.splice(hitSegmentIndex, 1);
        continue;
      }

      // Check collision with Spider
      for (let sIdx = this.spiders.length - 1; sIdx >= 0; sIdx--) {
        const sp = this.spiders[sIdx];
        if (Math.hypot(b.x - sp.x, b.y - sp.y) < 16) {
          b.active = false;
          // Distance to player determines score
          const distToPlayer = Math.hypot(this.player.x - sp.x, this.player.y - sp.y);
          let spiderScore = SCORE_SPIDER_DISTANCES.FAR;
          if (distToPlayer < 50) {
            spiderScore = SCORE_SPIDER_DISTANCES.CLOSE;
          } else if (distToPlayer < 110) {
            spiderScore = SCORE_SPIDER_DISTANCES.MEDIUM;
          }

          this.addScore(spiderScore, sp.x, sp.y, true);
          sounds.playSpiderHit();
          this.spawnExplosion(sp.x, sp.y, this.theme.spiderColor, 20);
          this.spiders.splice(sIdx, 1);
          break;
        }
      }

      // Check collision with Flea
      for (let fIdx = this.fleas.length - 1; fIdx >= 0; fIdx--) {
        const fl = this.fleas[fIdx];
        if (Math.hypot(b.x - fl.x, b.y - fl.y) < 14) {
          b.active = false;
          fl.health--;
          if (fl.health <= 0) {
            this.addScore(SCORE_FLEA, fl.x, fl.y, true);
            sounds.playMushroomDestroyed();
            this.spawnExplosion(fl.x, fl.y, this.theme.fleaColor, 16);
            this.fleas.splice(fIdx, 1);
          } else {
            // Flea drops twice as fast on first hit!
            fl.vy *= 1.8;
            sounds.playMushroomHit();
            this.spawnExplosion(b.x, b.y, this.theme.fleaColor, 8);
          }
          break;
        }
      }

      // Check collision with Scorpion
      for (let scIdx = this.scorpions.length - 1; scIdx >= 0; scIdx--) {
        const sc = this.scorpions[scIdx];
        if (Math.hypot(b.x - sc.x, b.y - sc.y) < 15) {
          b.active = false;
          this.addScore(SCORE_SCORPION, sc.x, sc.y, true);
          sounds.playSpiderHit();
          this.spawnExplosion(sc.x, sc.y, this.theme.scorpionColor, 24);
          this.scorpions.splice(scIdx, 1);
          break;
        }
      }
    }

    // Clean up inactive bullets
    this.bullets = this.bullets.filter(b => b.active);
  }

  private updateCentipedes() {
    this.stepTimer++;

    // Dynamic speed: fewer total segments remaining = faster scurrying
    const speedBoost = Math.max(0, Math.floor((12 - this.centipedeSegments.length) / 3));
    const currentInterval = Math.max(2, this.stepInterval - speedBoost);

    if (this.stepTimer < currentInterval) return;
    this.stepTimer = 0;

    sounds.playCentipedeStep();

    // Group segments by chain to move leaders first or follow
    // In our model: each segment has a current grid cell.
    // When a head moves, it decides next grid cell (col + dirX).
    // If it hits a mushroom or wall, it moves down (or up in player area) and reverses dirX.
    // Followers take the previous position of the segment directly ahead of them.

    // Sort chains: we can organize by (parentChainId, orderInChain)
    const chainsMap = new Map<number, CentipedeSegment[]>();
    for (const seg of this.centipedeSegments) {
      const chainId = seg.parentChainId ?? 1;
      if (!chainsMap.has(chainId)) {
        chainsMap.set(chainId, []);
      }
      chainsMap.get(chainId)!.push(seg);
    }

    // For each chain, sort ascending by orderInChain
    for (const [, chain] of chainsMap) {
      chain.sort((a, b) => (a.orderInChain ?? 0) - (b.orderInChain ?? 0));

      // Record previous positions
      for (const seg of chain) {
        seg.prevX = seg.x;
        seg.prevY = seg.y;
      }

      // Find the leader (orderInChain lowest, or isHead)
      const head = chain[0];
      if (!head) continue;

      head.isHead = true; // ensure leader is a head

      if (head.isDiving) {
        // Poison diving mode: moves straight down
        head.prevX = head.x;
        head.prevY = head.y;
        head.y += 1;
        if (head.y >= GRID_ROWS - 1) {
          head.isDiving = false;
          head.y = GRID_ROWS - 1;
          head.dirY = -1; // start moving up in player zone
        }
      } else {
        const nextX = head.x + head.dirX;
        let blocked = false;
        let hitPoison = false;

        // Check horizontal boundary
        if (nextX < 0 || nextX >= GRID_COLS) {
          blocked = true;
        } else {
          // Check mushroom at next cell
          const m = this.mushrooms.get(`${nextX},${head.y}`);
          if (m) {
            blocked = true;
            if (m.isPoisoned) hitPoison = true;
          }
        }

        if (hitPoison) {
          head.isDiving = true;
          head.dirX = -head.dirX as (1 | -1);
          head.y += 1;
        } else if (blocked) {
          // Move down or up
          if (head.dirY === 1) {
            // Moving down
            if (head.y >= GRID_ROWS - 1) {
              // At bottom of screen, reverse vertical direction to roam player zone!
              head.dirY = -1;
              head.y -= 1;
            } else {
              head.y += 1;
            }
          } else {
            // Moving up (in player zone)
            if (head.y <= PLAYER_ROW_MIN) {
              head.dirY = 1;
              head.y += 1;
            } else {
              head.y -= 1;
            }
          }
          head.dirX = -head.dirX as (1 | -1);
        } else {
          head.x = nextX;
        }
      }

      // Move followers to previous positions of their leader
      for (let i = 1; i < chain.length; i++) {
        const leader = chain[i - 1];
        const follower = chain[i];
        follower.x = leader.prevX ?? leader.x;
        follower.y = leader.prevY ?? leader.y;
        follower.dirX = leader.dirX;
        follower.dirY = leader.dirY;
        follower.isDiving = leader.isDiving;
      }
    }

    // Check collision between centipede and player
    if (this.player.isAlive && this.player.invulnerableTimer === 0) {
      for (const seg of this.centipedeSegments) {
        const segPixelX = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const segPixelY = seg.y * CELL_SIZE + CELL_SIZE / 2;

        if (Math.hypot(this.player.x - segPixelX, this.player.y - segPixelY) < 12) {
          this.handlePlayerDeath();
          break;
        }
      }
    }
  }

  private updateSpiders() {
    this.spiderSpawnTimer--;
    if (this.spiderSpawnTimer <= 0 && this.spiders.length < 1) {
      this.spiderSpawnTimer = 350 + Math.random() * 250;
      const startLeft = Math.random() > 0.5;
      this.spiders.push({
        id: this.nextEntityId++,
        x: startLeft ? -10 : CANVAS_WIDTH + 10,
        y: (PLAYER_ROW_MIN + 2) * CELL_SIZE,
        vx: startLeft ? 1.6 : -1.6,
        vy: 1.5,
        timer: 450,
        bouncePattern: Math.random(),
        animTimer: 0,
      });
      sounds.playSpiderBounce();
    }

    for (let i = this.spiders.length - 1; i >= 0; i--) {
      const sp = this.spiders[i];
      sp.animTimer++;
      sp.timer--;

      // Bouncing motion in player zone
      sp.x += sp.vx;
      sp.y += sp.vy;

      const minY = PLAYER_ROW_MIN * CELL_SIZE;
      const maxY = (GRID_ROWS - 1) * CELL_SIZE;

      if (sp.y <= minY) {
        sp.y = minY;
        sp.vy = Math.abs(sp.vy);
        sounds.playSpiderBounce();
      } else if (sp.y >= maxY) {
        sp.y = maxY;
        sp.vy = -Math.abs(sp.vy);
        sounds.playSpiderBounce();
      }

      // Check if spider eats a mushroom
      const cellX = Math.round(sp.x / CELL_SIZE);
      const cellY = Math.round(sp.y / CELL_SIZE);
      const mKey = `${cellX},${cellY}`;
      if (this.mushrooms.has(mKey) && Math.random() < 0.08) {
        this.mushrooms.delete(mKey);
      }

      // Check player collision
      if (this.player.isAlive && this.player.invulnerableTimer === 0) {
        if (Math.hypot(this.player.x - sp.x, this.player.y - sp.y) < 15) {
          this.handlePlayerDeath();
          break;
        }
      }

      // Offscreen exit
      if (sp.timer <= 0 && (sp.x < -20 || sp.x > CANVAS_WIDTH + 20)) {
        this.spiders.splice(i, 1);
      }
    }
  }

  private updateFleas() {
    this.fleaSpawnTimer--;

    // Count mushrooms in player area
    let playerMushrooms = 0;
    for (const m of this.mushrooms.values()) {
      if (m.y >= PLAYER_ROW_MIN) playerMushrooms++;
    }

    // Flea triggers if few mushrooms in player zone
    if (this.fleaSpawnTimer <= 0 && this.fleas.length < 1 && (playerMushrooms < 5 || this.stats.wave > 1)) {
      this.fleaSpawnTimer = 500 + Math.random() * 300;
      const col = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
      this.fleas.push({
        id: this.nextEntityId++,
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: -10,
        vy: 3.5,
        health: 2,
      });
      sounds.playFleaDrop();
    }

    for (let i = this.fleas.length - 1; i >= 0; i--) {
      const fl = this.fleas[i];
      fl.y += fl.vy;

      // Drop mushrooms periodically
      const cellX = Math.floor(fl.x / CELL_SIZE);
      const cellY = Math.floor(fl.y / CELL_SIZE);
      if (cellY > 3 && cellY < GRID_ROWS - 1 && Math.random() < 0.22) {
        const mKey = `${cellX},${cellY}`;
        if (!this.mushrooms.has(mKey)) {
          this.mushrooms.set(mKey, {
            x: cellX,
            y: cellY,
            health: MUSHROOM_MAX_HEALTH,
            isPoisoned: false,
          });
        }
      }

      // Check collision with player
      if (this.player.isAlive && this.player.invulnerableTimer === 0) {
        if (Math.hypot(this.player.x - fl.x, this.player.y - fl.y) < 14) {
          this.handlePlayerDeath();
          break;
        }
      }

      // Offscreen exit
      if (fl.y > CANVAS_HEIGHT + 20) {
        this.fleas.splice(i, 1);
      }
    }
  }

  private updateScorpions() {
    if (this.stats.wave <= 1) return;

    this.scorpionSpawnTimer--;
    if (this.scorpionSpawnTimer <= 0 && this.scorpions.length < 1) {
      this.scorpionSpawnTimer = 700 + Math.random() * 400;
      const fromLeft = Math.random() > 0.5;
      const row = Math.floor(Math.random() * 12) + 6; // rows 6 to 18
      this.scorpions.push({
        id: this.nextEntityId++,
        x: fromLeft ? -15 : CANVAS_WIDTH + 15,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        dirX: fromLeft ? 1 : -1,
        speed: 1.8,
        animTimer: 0,
      });
      sounds.playScorpionPass();
    }

    for (let i = this.scorpions.length - 1; i >= 0; i--) {
      const sc = this.scorpions[i];
      sc.animTimer++;
      sc.x += sc.dirX * sc.speed;

      // Poison mushrooms touched
      const cellX = Math.round(sc.x / CELL_SIZE);
      const cellY = Math.round(sc.y / CELL_SIZE);
      const mKey = `${cellX},${cellY}`;
      const m = this.mushrooms.get(mKey);
      if (m && !m.isPoisoned) {
        m.isPoisoned = true;
      }

      // Offscreen exit
      if ((sc.dirX === 1 && sc.x > CANVAS_WIDTH + 25) || (sc.dirX === -1 && sc.x < -25)) {
        this.scorpions.splice(i, 1);
      }
    }
  }

  private handlePlayerDeath() {
    this.player.isAlive = false;
    this.stats.lives--;
    sounds.playDeathExplosion();
    this.spawnExplosion(this.player.x, this.player.y, '#38bdf8', 35);
    this.spawnExplosion(this.player.x, this.player.y, '#ef4444', 25);

    if (this.stats.lives <= 0) {
      this.stats.isGameOver = true;
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
        if (typeof window !== 'undefined') {
          localStorage.setItem('centipede_high_score', String(this.stats.highScore));
        }
      }
    } else {
      // Start regenerating damaged mushrooms and scoring bonus
      this.prepareMushroomRegeneration();
    }
  }

  private prepareMushroomRegeneration() {
    this.regeneratingMushrooms = [];
    for (const m of this.mushrooms.values()) {
      if (m.health < MUSHROOM_MAX_HEALTH || m.isPoisoned) {
        m.regenerating = true;
        this.regeneratingMushrooms.push(m);
      }
    }
    this.regenTimer = 0;
  }

  private updateMushroomRegeneration() {
    this.regenTimer++;
    if (this.regenTimer % 4 === 0 && this.regeneratingMushrooms.length > 0) {
      const m = this.regeneratingMushrooms.shift()!;
      m.health = MUSHROOM_MAX_HEALTH;
      m.isPoisoned = false;
      m.regenerating = false;
      this.addScore(SCORE_MUSHROOM_REGEN, m.x * CELL_SIZE + 8, m.y * CELL_SIZE + 8, false);
      sounds.playMushroomHit();
    }

    if (this.regeneratingMushrooms.length === 0) {
      // Reset player and centipede wave state
      this.player.x = CANVAS_WIDTH / 2;
      this.player.y = (GRID_ROWS - 2) * CELL_SIZE;
      this.player.isAlive = true;
      this.player.invulnerableTimer = 100;
      this.bullets = [];
      this.spiders = [];
      this.fleas = [];
      this.scorpions = [];

      // Re-spawn wave centipede
      this.spawnWaveCentipede(this.stats.wave);
    }
  }

  private handleWaveClear() {
    this.stats.waveCompleted = true;
    sounds.playWaveComplete();

    // Reward for wave clear
    this.addScore(1000, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, true);

    // Regenerate mushrooms for bonus points before next wave
    this.prepareMushroomRegeneration();

    setTimeout(() => {
      this.startWave(this.stats.wave + 1);
    }, 1200);
  }

  public addScore(points: number, x: number, y: number, showFloat: boolean = true) {
    this.stats.score += points;

    // Check high score
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('centipede_high_score', String(this.stats.highScore));
      }
    }

    // Extra life check (every 12,000 pts)
    if (this.stats.score >= this.nextExtraLifeThreshold) {
      this.stats.lives++;
      this.nextExtraLifeThreshold += EXTRA_LIFE_SCORE;
      sounds.playExtraLife();
      this.floatingScores.push({
        id: this.nextEntityId++,
        text: 'EXTRA LIFE!',
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2 - 20,
        alpha: 1.5,
        color: '#facc15',
      });
    }

    if (showFloat) {
      this.floatingScores.push({
        id: this.nextEntityId++,
        text: `+${points}`,
        x,
        y: y - 8,
        alpha: 1.0,
        color: '#ffffff',
      });
    }
  }

  public spawnExplosion(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1.5,
        alpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 15) + 15,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingScores() {
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const s = this.floatingScores[i];
      s.y -= 0.8;
      s.alpha -= 0.02;

      if (s.alpha <= 0) {
        this.floatingScores.splice(i, 1);
      }
    }
  }

  public togglePause() {
    this.stats.isPaused = !this.stats.isPaused;
  }
}
