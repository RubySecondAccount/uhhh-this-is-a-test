import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
  GRID_ROWS,
  PLAYER_ROW_MIN,
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
} from '../types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public clear() {
    this.ctx.fillStyle = '#09090b'; // Dark background
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  public drawPlayerZone() {
    // Subtle background tint for player area
    const playerZoneY = PLAYER_ROW_MIN * CELL_SIZE;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.fillRect(0, playerZoneY, CANVAS_WIDTH, CANVAS_HEIGHT - playerZoneY);

    // Subtle boundary line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, playerZoneY);
    this.ctx.lineTo(CANVAS_WIDTH, playerZoneY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  public drawMushrooms(mushrooms: Mushroom[], theme: WaveTheme) {
    const ctx = this.ctx;

    for (const m of mushrooms) {
      const px = m.x * CELL_SIZE;
      const py = m.y * CELL_SIZE;
      const primaryColor = m.isPoisoned ? theme.poisonMushroomColor : theme.mushroomColor;
      const accentColor = m.isPoisoned ? '#ffffff' : theme.mushroomAccent;

      ctx.save();
      ctx.translate(px, py);

      // Flash if regenerating
      if (m.regenerating) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.restore();
        continue;
      }

      // Stem
      ctx.fillStyle = accentColor;
      ctx.fillRect(6, 8, 4, 7);

      // Cap
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.ellipse(8, 7, 7, 5, 0, Math.PI, 0);
      ctx.fill();

      // Mushroom spot / highlight
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(8, 5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Damage bites (health goes from 4 down to 1)
      if (m.health < 4) {
        ctx.fillStyle = '#09090b';
        // First bite (top right)
        ctx.beginPath();
        ctx.arc(12, 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (m.health < 3) {
        // Second bite (top left)
        ctx.beginPath();
        ctx.arc(4, 5, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      if (m.health < 2) {
        // Third bite (chunk out of center / stem)
        ctx.beginPath();
        ctx.arc(7, 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Poison drip indicator if poisoned
      if (m.isPoisoned) {
        ctx.fillStyle = theme.poisonMushroomColor;
        ctx.beginPath();
        ctx.arc(8, 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  public drawCentipedes(segments: CentipedeSegment[], theme: WaveTheme, timestamp: number) {
    const ctx = this.ctx;

    for (const seg of segments) {
      const px = seg.x * CELL_SIZE;
      const py = seg.y * CELL_SIZE;
      const cx = px + CELL_SIZE / 2;
      const cy = py + CELL_SIZE / 2;

      ctx.save();
      ctx.translate(cx, cy);

      // Scurrying legs animation
      const legPhase = Math.sin(timestamp * 0.02 + seg.id);
      ctx.strokeStyle = seg.isHead ? theme.centipedeHeadColor : theme.centipedeBodyColor;
      ctx.lineWidth = 1.5;

      // Draw 4 little legs poking outward
      const legAngle1 = legPhase * 0.4;
      const legAngle2 = -legPhase * 0.4;

      ctx.beginPath();
      // Left legs
      ctx.moveTo(-4, -3);
      ctx.lineTo(-7 - Math.cos(legAngle1) * 2, -5 + Math.sin(legAngle1) * 3);
      ctx.moveTo(-4, 3);
      ctx.lineTo(-7 - Math.cos(legAngle2) * 2, 5 + Math.sin(legAngle2) * 3);
      // Right legs
      ctx.moveTo(4, -3);
      ctx.lineTo(7 + Math.cos(legAngle2) * 2, -5 + Math.sin(legAngle2) * 3);
      ctx.moveTo(4, 3);
      ctx.lineTo(7 + Math.cos(legAngle1) * 2, 5 + Math.sin(legAngle1) * 3);
      ctx.stroke();

      if (seg.isHead) {
        // Centipede Head
        ctx.fillStyle = theme.centipedeHeadColor;
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes facing direction
        ctx.fillStyle = '#000000';
        const eyeOffset = seg.dirX * 3;
        ctx.beginPath();
        ctx.arc(eyeOffset, -2, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeOffset, 2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red pupil dots
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(eyeOffset + seg.dirX * 0.5, -2, 0.8, 0, Math.PI * 2);
        ctx.arc(eyeOffset + seg.dirX * 0.5, 2, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = theme.centipedeHeadColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(eyeOffset, -3);
        ctx.lineTo(eyeOffset + seg.dirX * 5, -7 + legPhase * 1.5);
        ctx.moveTo(eyeOffset, 3);
        ctx.lineTo(eyeOffset + seg.dirX * 5, 7 - legPhase * 1.5);
        ctx.stroke();
      } else {
        // Centipede Body Segment
        ctx.fillStyle = theme.centipedeBodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Segment core ring
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  public drawPlayer(player: Player, timestamp: number) {
    if (!player.isAlive) return;

    // Flashing during invulnerability
    if (player.invulnerableTimer > 0 && Math.floor(timestamp / 80) % 2 === 0) {
      return;
    }

    const ctx = this.ctx;
    const px = player.x;
    const py = player.y;

    ctx.save();
    ctx.translate(px, py);

    // Ship body
    ctx.fillStyle = '#38bdf8'; // Sky blue blaster
    ctx.beginPath();
    ctx.moveTo(0, -9); // tip
    ctx.lineTo(7, 7);  // bottom right
    ctx.lineTo(3, 4);  // inner right
    ctx.lineTo(-3, 4); // inner left
    ctx.lineTo(-7, 7); // bottom left
    ctx.closePath();
    ctx.fill();

    // Central blaster cannon
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -11, 3, 6);

    // Cockpit neon core
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Thruster pulse
    const thrusterHeight = 3 + Math.sin(timestamp * 0.05) * 2;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-2.5, 5);
    ctx.lineTo(0, 5 + thrusterHeight);
    ctx.lineTo(2.5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  public drawBullets(bullets: Bullet[]) {
    const ctx = this.ctx;
    for (const b of bullets) {
      if (!b.active) continue;

      ctx.save();
      // Glow
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - 1.5, b.y - 7, 3, 10);

      // High-energy dart tip
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(b.x - 0.75, b.y - 8, 1.5, 3);
      ctx.restore();
    }
  }

  public drawSpider(spider: Spider, theme: WaveTheme, timestamp: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(spider.x, spider.y);

    const legWave = Math.sin(timestamp * 0.03);

    // Spider legs (4 pairs)
    ctx.strokeStyle = theme.spiderColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    // Left legs
    ctx.moveTo(-3, -3);
    ctx.lineTo(-8 + legWave * 2, -8);
    ctx.lineTo(-12, -4 - legWave * 2);

    ctx.moveTo(-4, 0);
    ctx.lineTo(-10 - legWave * 2, 0);
    ctx.lineTo(-13, 3 + legWave * 2);

    ctx.moveTo(-3, 3);
    ctx.lineTo(-8 + legWave * 2, 7);
    ctx.lineTo(-11, 10 - legWave * 2);

    // Right legs
    ctx.moveTo(3, -3);
    ctx.lineTo(8 - legWave * 2, -8);
    ctx.lineTo(12, -4 + legWave * 2);

    ctx.moveTo(4, 0);
    ctx.lineTo(10 + legWave * 2, 0);
    ctx.lineTo(13, 3 - legWave * 2);

    ctx.moveTo(3, 3);
    ctx.lineTo(8 - legWave * 2, 7);
    ctx.lineTo(11, 10 + legWave * 2);

    ctx.stroke();

    // Spider abdomen & cephalothorax
    ctx.fillStyle = theme.spiderColor;
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Abdomen pattern
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Red eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-1.5, -4, 1, 0, Math.PI * 2);
    ctx.arc(1.5, -4, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawFlea(flea: Flea, theme: WaveTheme, timestamp: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(flea.x, flea.y);

    const shimmy = Math.sin(timestamp * 0.05) * 1.5;

    // Flea body
    ctx.fillStyle = theme.fleaColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flea segments
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.moveTo(-3.5, 1);
    ctx.lineTo(3.5, 1);
    ctx.stroke();

    // Flea legs
    ctx.strokeStyle = theme.fleaColor;
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.lineTo(-6, 7 + shimmy);
    ctx.moveTo(3, 3);
    ctx.lineTo(6, 7 - shimmy);
    ctx.stroke();

    ctx.restore();
  }

  public drawScorpion(scorpion: Scorpion, theme: WaveTheme, timestamp: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(scorpion.x, scorpion.y);

    const dir = scorpion.dirX;
    const walk = Math.sin(timestamp * 0.02) * 2;

    // Body
    ctx.fillStyle = theme.scorpionColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front claws / pincers
    ctx.strokeStyle = theme.scorpionColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dir * 6, -2);
    ctx.lineTo(dir * 11, -5);
    ctx.lineTo(dir * 13, -3);

    ctx.moveTo(dir * 6, 2);
    ctx.lineTo(dir * 11, 5);
    ctx.lineTo(dir * 13, 3);
    ctx.stroke();

    // Arched tail and stinger
    ctx.beginPath();
    ctx.moveTo(-dir * 6, 0);
    ctx.quadraticCurveTo(-dir * 12, -7, -dir * 9, -11);
    ctx.lineTo(-dir * 6, -10);
    ctx.stroke();

    // Glowing venom tip
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-dir * 6, -10, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = theme.scorpionColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.lineTo(-5, 7 + walk);
    ctx.moveTo(1, 3);
    ctx.lineTo(0, 7 - walk);
    ctx.moveTo(4, 3);
    ctx.lineTo(5, 7 + walk);

    ctx.moveTo(-3, -3);
    ctx.lineTo(-5, -7 - walk);
    ctx.moveTo(1, -3);
    ctx.lineTo(0, -7 + walk);
    ctx.moveTo(4, -3);
    ctx.lineTo(5, -7 - walk);
    ctx.stroke();

    ctx.restore();
  }

  public drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  public drawFloatingScores(scores: FloatingScore[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    for (const s of scores) {
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.restore();
  }

  public drawCRTScanlines() {
    const ctx = this.ctx;
    ctx.save();
    // Interlaced scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1.2);
    }

    // Subtle phosphor vignette
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH * 0.4,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH * 0.8
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.restore();
  }
}
