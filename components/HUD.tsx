
import React from 'react';
import { GameState } from '../types';

interface HUDProps {
  state: GameState;
}

const HUD: React.FC<HUDProps> = ({ state }) => {
  const healthPercent = (state.health / state.maxHealth) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-20">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="text-4xl font-black text-white tracking-tighter italic drop-shadow-lg">
            {state.score.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Global Score</div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-yellow-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
           <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black font-black text-[10px]">$</div>
           <div className="text-xl font-black text-white italic">{state.coins}</div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-white italic tracking-tight">SECTOR {state.wave}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Wave</div>
        </div>
      </div>

      {/* Bottom Bar - Health */}
      <div className="w-full max-w-xl mx-auto mb-4 bg-slate-950/40 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
        <div className="flex justify-between mb-2 items-end">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em]">Core Integrity</span>
            <div className="h-1 w-12 bg-sky-500 mt-1" />
          </div>
          <span className="text-sm font-black text-white italic">{Math.ceil(state.health)} / {state.maxHealth}</span>
        </div>
        <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div 
            className={`h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)] ${healthPercent > 30 ? 'bg-sky-400' : 'bg-red-500 animate-pulse'}`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default HUD;
