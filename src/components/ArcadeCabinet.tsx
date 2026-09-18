import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Play,
  RotateCcw,
  MousePointer,
  Keyboard,
  Pause,
} from 'lucide-react';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { GameStats, ControlMode } from '../types';
import { sounds } from '../utils/audio';
import { HowToPlayModal } from './HowToPlayModal';
import { TouchControls } from './TouchControls';

export const ArcadeCabinet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // React state for HUD
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    lives: 3,
    wave: 1,
    isGameOver: false,
    isPaused: false,
    waveCompleted: false,
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [controlMode, setControlMode] = useState<ControlMode>('keyboard');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Initialize engine and renderer
  useEffect(() => {
    // Detect touch
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      if (hasTouch) {
        setControlMode('touch');
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = new GameEngine();
    const renderer = new GameRenderer(ctx);

    engineRef.current = engine;
    rendererRef.current = renderer;

    setStats({ ...engine.stats });

    // Game loop
    let lastTime = 0;
    const loop = (timestamp: number) => {
      // Limit to ~60fps
      if (timestamp - lastTime >= 15) {
        lastTime = timestamp;

        engine.update(timestamp);
        setStats({ ...engine.stats });

        renderer.clear();
        renderer.drawPlayerZone();
        renderer.drawMushrooms(Array.from(engine.mushrooms.values()), engine.theme);
        renderer.drawCentipedes(engine.centipedeSegments, engine.theme, timestamp);
        renderer.drawPlayer(engine.player, timestamp);
        renderer.drawBullets(engine.bullets);

        for (const sp of engine.spiders) {
          renderer.drawSpider(sp, engine.theme, timestamp);
        }
        for (const fl of engine.fleas) {
          renderer.drawFlea(fl, engine.theme, timestamp);
        }
        for (const sc of engine.scorpions) {
          renderer.drawScorpion(sc, engine.theme, timestamp);
        }

        renderer.drawParticles(engine.particles);
        renderer.drawFloatingScores(engine.floatingScores);

        if (crtEffect) {
          renderer.drawCRTScanlines();
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [crtEffect]);

  // Sync sound toggle
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const engine = engineRef.current;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        engine.togglePause();
        setStats({ ...engine.stats });
        return;
      }

      if (engine.stats.isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
        engine.startNewGame();
        setStats({ ...engine.stats });
        return;
      }

      engine.keys[e.code] = true;

      // Prevent window scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      engineRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse / Trackball Movement on Canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (controlMode !== 'mouse' || !engineRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const mouseCanvasX = (e.clientX - rect.left) * scaleX;
    const mouseCanvasY = (e.clientY - rect.top) * scaleY;

    engineRef.current.mouseTarget.x = mouseCanvasX;
    engineRef.current.mouseTarget.y = mouseCanvasY;
    engineRef.current.mouseTarget.active = true;
  }, [controlMode]);

  const handleMouseDown = useCallback(() => {
    if (controlMode === 'mouse' && engineRef.current) {
      engineRef.current.isFiring = true;
    }
  }, [controlMode]);

  const handleMouseUp = useCallback(() => {
    if (controlMode === 'mouse' && engineRef.current) {
      engineRef.current.isFiring = false;
    }
  }, [controlMode]);

  const handleMouseLeave = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.mouseTarget.active = false;
      engineRef.current.isFiring = false;
    }
  }, []);

  // Touch control callbacks
  const handleTouchDirection = useCallback((dir: string, pressed: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.keys[dir] = pressed;
  }, []);

  const handleTouchFire = useCallback((pressed: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.isFiring = pressed;
    if (pressed) {
      engineRef.current.fireBullet();
    }
  }, []);

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startNewGame();
      setStats({ ...engineRef.current.stats });
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      setStats({ ...engineRef.current.stats });
    }
  };

  return (
    <div
      id="centipede-cabinet-container"
      className="flex flex-col items-center justify-center min-h-screen w-full bg-zinc-950 p-2 sm:p-4 text-zinc-100"
    >
      {/* Cabinet Frame */}
      <div
        id="arcade-cabinet-frame"
        ref={containerRef}
        className="relative flex flex-col items-center bg-zinc-900 border-4 border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-3 sm:p-5 max-w-xl w-full"
      >
        {/* Arcade Marquee Header */}
        <div
          id="cabinet-marquee"
          className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between shadow-inner"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-base sm:text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 font-['Press_Start_2P',monospace]">
              CENTIPEDE
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="help-btn"
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
              title="How to Play"
              aria-label="How to play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              id="crt-toggle-btn"
              onClick={() => setCrtEffect(!crtEffect)}
              className={`p-1.5 rounded-lg transition ${
                crtEffect ? 'bg-cyan-900/60 text-cyan-300' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Toggle CRT Scanlines"
              aria-label="Toggle CRT Scanlines"
            >
              <Tv className="w-4 h-4" />
            </button>
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
              title="Toggle Audio"
              aria-label="Toggle Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
            <button
              id="pause-toggle-btn"
              onClick={handleTogglePause}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
              title="Pause Game (P)"
              aria-label="Pause Game"
            >
              {stats.isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Arcade HUD */}
        <div
          id="arcade-hud"
          className="w-full bg-zinc-950 border border-zinc-800/80 rounded-t-xl px-4 py-2 flex items-center justify-between font-['Press_Start_2P',monospace] text-[10px] sm:text-xs select-none"
        >
          {/* Current Score */}
          <div className="flex flex-col">
            <span className="text-red-500 text-[9px] mb-0.5 animate-pulse">1UP</span>
            <span className="text-white font-bold tracking-wider">
              {String(stats.score).padStart(6, '0')}
            </span>
          </div>

          {/* High Score */}
          <div className="flex flex-col items-center">
            <span className="text-amber-400 text-[9px] mb-0.5">HIGH SCORE</span>
            <span className="text-amber-300 font-bold tracking-wider">
              {String(stats.highScore).padStart(6, '0')}
            </span>
          </div>

          {/* Wave & Lives */}
          <div className="flex flex-col items-end">
            <span className="text-cyan-400 text-[9px] mb-0.5">WAVE {stats.wave}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(0, stats.lives) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-3 bg-sky-400 rounded-t-xs clip-triangle"
                  title="Extra Blaster"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Display Screen */}
        <div
          id="arcade-screen-bezel"
          className="relative w-full aspect-[480/512] bg-zinc-950 border-x border-b border-zinc-800 rounded-b-xl overflow-hidden shadow-2xl flex items-center justify-center"
        >
          <canvas
            id="centipede-game-canvas"
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`w-full h-full block ${controlMode === 'mouse' ? 'cursor-crosshair' : 'cursor-default'}`}
          />

          {/* Pause Overlay */}
          {stats.isPaused && !stats.isGameOver && (
            <div
              id="pause-overlay"
              className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-4 text-center p-6 z-20"
            >
              <h2 className="text-2xl font-bold text-amber-400 font-['Press_Start_2P',monospace] animate-pulse">
                PAUSED
              </h2>
              <p className="text-xs text-zinc-300 font-['Share_Tech_Mono',monospace]">
                Press P, ESC or click below to resume
              </p>
              <button
                id="resume-btn"
                onClick={handleTogglePause}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-['Press_Start_2P',monospace] text-xs rounded-lg transition active:scale-95"
              >
                RESUME
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {stats.isGameOver && (
            <div
              id="game-over-overlay"
              className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 text-center p-6 z-30"
            >
              <div className="w-12 h-12 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-red-500 mb-1">
                <RotateCcw className="w-6 h-6 animate-spin-slow" />
              </div>
              <h2 className="text-2xl font-black text-red-500 font-['Press_Start_2P',monospace] tracking-wider">
                GAME OVER
              </h2>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xs font-['Share_Tech_Mono',monospace]">
                <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">FINAL SCORE</span>
                  <span className="text-white font-bold font-['Press_Start_2P',monospace] text-xs">
                    {stats.score}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">WAVE REACHED</span>
                  <span className="text-cyan-400 font-bold font-['Press_Start_2P',monospace] text-xs">
                    {stats.wave}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-zinc-400">HIGH SCORE</span>
                  <span className="text-amber-400 font-bold font-['Press_Start_2P',monospace] text-xs">
                    {stats.highScore}
                  </span>
                </div>
              </div>

              {stats.score >= stats.highScore && stats.score > 0 && (
                <span className="text-amber-400 font-bold text-xs font-['Press_Start_2P',monospace] animate-bounce">
                  ★ NEW HIGH SCORE! ★
                </span>
              )}

              <button
                id="play-again-btn"
                onClick={handleRestart}
                className="mt-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-['Press_Start_2P',monospace] text-xs rounded-xl shadow-lg shadow-red-950 active:scale-95 transition"
              >
                INSERT COIN / PLAY
              </button>
              <p className="text-[10px] text-zinc-500 font-['Share_Tech_Mono',monospace]">
                or press SPACEBAR
              </p>
            </div>
          )}
        </div>

        {/* Lower Control Deck / Mode Selector */}
        <div
          id="cabinet-control-deck"
          className="w-full mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-['Share_Tech_Mono',monospace]"
        >
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 mr-1">INPUT:</span>
            <button
              id="control-keyboard-btn"
              onClick={() => setControlMode('keyboard')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                controlMode === 'keyboard'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" /> KEYBOARD
            </button>
            <button
              id="control-mouse-btn"
              onClick={() => setControlMode('mouse')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                controlMode === 'mouse'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" /> MOUSE / TRACKBALL
            </button>
          </div>

          <div className="text-zinc-400 text-[11px] hidden sm:block">
            {controlMode === 'keyboard' ? 'WASD / Arrows to Move • Space to Shoot' : 'Aim with Cursor • Click to Shoot'}
          </div>
        </div>

        {/* On-screen touch controls if on touch device or toggled */}
        {isTouchDevice && (
          <div className="w-full mt-2">
            <TouchControls
              onDirectionPress={handleTouchDirection}
              onFirePress={handleTouchFire}
            />
          </div>
        )}
      </div>

      {/* Field Manual / Instructions Modal */}
      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
