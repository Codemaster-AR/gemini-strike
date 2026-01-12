
import React from 'react';

interface MenuProps {
  onStart: () => void;
}

const Menu: React.FC<MenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
      <div className="max-w-md w-full p-8 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic text-white tracking-tighter drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
            VANGUARD
          </h1>
          <p className="text-sky-400 font-bold tracking-[0.5em] uppercase text-sm">Gemini Strike</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-slate-400 text-sm leading-relaxed text-left">
          <p className="mb-4">Command the latest prototype scout-craft in high-stakes atmospheric combat. Engage waves of hostile interceptors and fortified ground targets.</p>
          <ul className="space-y-2 font-mono text-[11px] uppercase tracking-wider">
            <li>• Use MOUSE to maneuver</li>
            <li>• AUTO-FIRE initialized</li>
            <li>• TARGET RED signatures</li>
            <li>• EVADE enemy ballistics</li>
          </ul>
        </div>

        <button 
          onClick={onStart}
          className="group relative px-8 py-4 w-full bg-sky-600 hover:bg-sky-500 text-white font-black italic tracking-widest text-xl rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">ENGAGE OPERATION</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        </button>

        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Tactical Assistant powered by Gemini AI</p>
      </div>
    </div>
  );
};

export default Menu;
