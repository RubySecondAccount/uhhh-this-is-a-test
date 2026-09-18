import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface TouchControlsProps {
  onDirectionPress: (dir: string, pressed: boolean) => void;
  onFirePress: (pressed: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionPress,
  onFirePress,
}) => {
  return (
    <div
      id="touch-controls-container"
      className="w-full max-w-lg mx-auto flex items-center justify-between px-4 py-3 select-none touch-none"
    >
      {/* Directional Pad */}
      <div id="touch-dpad" className="grid grid-cols-3 gap-1.5 w-36 h-36">
        <div />
        <button
          id="dpad-up"
          type="button"
          onTouchStart={() => onDirectionPress('ArrowUp', true)}
          onTouchEnd={() => onDirectionPress('ArrowUp', false)}
          onMouseDown={() => onDirectionPress('ArrowUp', true)}
          onMouseUp={() => onDirectionPress('ArrowUp', false)}
          className="flex items-center justify-center bg-zinc-800/80 active:bg-cyan-600 text-zinc-200 active:text-white rounded-lg border border-zinc-700 active:scale-95 transition"
          aria-label="Move Up"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          id="dpad-left"
          type="button"
          onTouchStart={() => onDirectionPress('ArrowLeft', true)}
          onTouchEnd={() => onDirectionPress('ArrowLeft', false)}
          onMouseDown={() => onDirectionPress('ArrowLeft', true)}
          onMouseUp={() => onDirectionPress('ArrowLeft', false)}
          className="flex items-center justify-center bg-zinc-800/80 active:bg-cyan-600 text-zinc-200 active:text-white rounded-lg border border-zinc-700 active:scale-95 transition"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="bg-zinc-900/60 rounded-lg flex items-center justify-center text-zinc-600 text-xs">
          •
        </div>

        <button
          id="dpad-right"
          type="button"
          onTouchStart={() => onDirectionPress('ArrowRight', true)}
          onTouchEnd={() => onDirectionPress('ArrowRight', false)}
          onMouseDown={() => onDirectionPress('ArrowRight', true)}
          onMouseUp={() => onDirectionPress('ArrowRight', false)}
          className="flex items-center justify-center bg-zinc-800/80 active:bg-cyan-600 text-zinc-200 active:text-white rounded-lg border border-zinc-700 active:scale-95 transition"
          aria-label="Move Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <div />
        <button
          id="dpad-down"
          type="button"
          onTouchStart={() => onDirectionPress('ArrowDown', true)}
          onTouchEnd={() => onDirectionPress('ArrowDown', false)}
          onMouseDown={() => onDirectionPress('ArrowDown', true)}
          onMouseUp={() => onDirectionPress('ArrowDown', false)}
          className="flex items-center justify-center bg-zinc-800/80 active:bg-cyan-600 text-zinc-200 active:text-white rounded-lg border border-zinc-700 active:scale-95 transition"
          aria-label="Move Down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* Large Ergonomic Fire Button */}
      <div id="touch-fire-action" className="flex flex-col items-center">
        <button
          id="touch-fire-button"
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onFirePress(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onFirePress(false);
          }}
          onMouseDown={() => onFirePress(true)}
          onMouseUp={() => onFirePress(false)}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 active:from-red-700 active:to-rose-600 border-4 border-red-400/40 text-white font-bold flex flex-col items-center justify-center shadow-lg active:scale-90 transition transform"
          aria-label="Fire Blaster"
        >
          <Zap className="w-7 h-7 text-amber-200" />
          <span className="font-['Press_Start_2P',monospace] text-[10px] mt-1 text-amber-100 tracking-wider">
            FIRE
          </span>
        </button>
      </div>
    </div>
  );
};
