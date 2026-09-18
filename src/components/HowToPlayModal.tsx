import React from 'react';
import { X, Trophy, Bug, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="how-to-play-modal"
        className="relative w-full max-w-lg bg-zinc-900 border-2 border-zinc-700 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-how-to-play-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          aria-label="Close instructions"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-amber-400">
          <Trophy className="w-6 h-6" />
          <h2 className="text-lg font-bold tracking-wider font-['Press_Start_2P',monospace]">
            FIELD MANUAL
          </h2>
        </div>

        <div className="space-y-4 text-sm font-['Share_Tech_Mono',monospace]">
          {/* Controls */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> CONTROLS
            </h3>
            <ul className="space-y-1 text-zinc-300">
              <li>• <span className="text-white font-bold">Movement:</span> Arrow Keys or <span className="text-white font-bold">W A S D</span> / Mouse Pointer</li>
              <li>• <span className="text-white font-bold">Fire:</span> <span className="text-white font-bold">Spacebar</span>, <span className="text-white font-bold">Z</span>, or Left Click (Hold for rapid)</li>
              <li>• <span className="text-white font-bold">Pause:</span> <span className="text-white font-bold">P</span> or Esc</li>
              <li>• <span className="text-white font-bold">Zone:</span> Your Bug Blaster can roam freely within the bottom safety area.</li>
            </ul>
          </div>

          {/* Enemies & Points */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
              <Bug className="w-4 h-4" /> TARGETS & SCORE
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-zinc-900/60 rounded border border-zinc-800">
                <span className="text-red-400 font-bold block">CENTIPEDE HEAD</span>
                <span className="text-amber-300 font-bold">100 PTS</span>
                <p className="text-[11px] text-zinc-400 mt-1">Leading segment. Moves fast!</p>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded border border-zinc-800">
                <span className="text-orange-400 font-bold block">CENTIPEDE BODY</span>
                <span className="text-amber-300 font-bold">10 PTS</span>
                <p className="text-[11px] text-zinc-400 mt-1">Turns into mushroom on hit & splits chain!</p>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded border border-zinc-800">
                <span className="text-sky-400 font-bold block">SPIDER</span>
                <span className="text-amber-300 font-bold">300 / 600 / 900 PTS</span>
                <p className="text-[11px] text-zinc-400 mt-1">Bounces in your zone. Closer shot = more pts!</p>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded border border-zinc-800">
                <span className="text-yellow-400 font-bold block">FLEA</span>
                <span className="text-amber-300 font-bold">200 PTS</span>
                <p className="text-[11px] text-zinc-400 mt-1">Dives down dropping mushrooms. Takes 2 hits!</p>
              </div>
              <div className="p-2 bg-zinc-900/60 rounded border border-zinc-800 col-span-2">
                <span className="text-purple-400 font-bold block">SCORPION</span>
                <span className="text-amber-300 font-bold">1,000 PTS</span>
                <p className="text-[11px] text-zinc-400 mt-1">Crawls across rows poisoning all mushrooms it touches.</p>
              </div>
            </div>
          </div>

          {/* Mushrooms & Poison */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <h3 className="text-pink-400 font-bold mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> MUSHROOMS & POISON
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Mushrooms block your shots and deflect the centipede down. They take <span className="text-white font-bold">4 hits</span> to destroy.
              Beware <span className="text-pink-400 font-bold">Poisoned Mushrooms</span> (turned by Scorpions)—centipedes that touch them will instantly dive straight to the bottom!
            </p>
          </div>

          {/* Bonus */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <h3 className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> EXTRA LIFE
            </h3>
            <p className="text-xs text-zinc-300">
              Awarded every <span className="text-amber-400 font-bold">12,000 points</span>. Damaged mushrooms regenerate between waves awarding +10 bonus points each.
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            id="close-instructions-modal-btn"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg font-['Press_Start_2P',monospace] text-xs transition active:scale-95"
          >
            LET'S BLAST!
          </button>
        </div>
      </div>
    </div>
  );
};
