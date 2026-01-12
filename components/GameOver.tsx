
import React from 'react';

interface GameOverProps {
  score: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, onRestart }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 backdrop-blur-xl z-50">
      <div className="max-w-md w-full p-12 text-center space-y-8 bg-black/60 border border-red-500/30 rounded-3xl shadow-2xl">
        <div className="space-y-2">
          <h2 className="text-5xl font-black italic text-red-500 tracking-tighter">
            HULL BREACH
          </h2>
          <p className="text-white font-bold tracking-widest uppercase text-xs opacity-50">Mission Terminated</p>
        </div>

        <div className="py-8 border-y border-red-500/20">
          <p className="text-slate-400 uppercase text-xs font-bold tracking-[0.3em] mb-2">Final Evaluation</p>
          <div className="text-6xl font-black text-white italic tracking-tighter">{score.toLocaleString()}</div>
          <p className="text-sky-400 text-xs font-bold mt-2">Combat Points Earned</p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onRestart}
            className="px-8 py-4 w-full bg-white text-black font-black italic tracking-widest text-xl rounded-xl transition-all duration-300 hover:bg-sky-400 hover:scale-105 active:scale-95"
          >
            REDEPLOY UNIT
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 w-full bg-transparent border border-white/20 text-white font-bold tracking-widest text-xs uppercase hover:bg-white/5 rounded-xl transition-all duration-300"
          >
            Return to Command
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
