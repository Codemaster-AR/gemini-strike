
import React from 'react';
import { GameState, Upgrades } from '../types';
import { GAME_CONSTANTS } from '../constants';

interface UpgradeShopProps {
  state: GameState;
  onUpgrade: (type: keyof Upgrades) => void;
  onClose: () => void;
}

const UpgradeShop: React.FC<UpgradeShopProps> = ({ state, onUpgrade, onClose }) => {
  const getCost = (level: number) => GAME_CONSTANTS.UPGRADE_BASE_COST * (level + 1);

  const upgradeItems: { label: string; type: keyof Upgrades; desc: string }[] = [
    { label: 'Weapon Systems', type: 'fireRate', desc: 'Increase rate of fire' },
    { label: 'Engine Thrust', type: 'speed', desc: 'Higher maneuverability' },
    { label: 'Plasma Core', type: 'damage', desc: 'Higher projectile damage' },
    { label: 'Hull Reinforcement', type: 'maxHealth', desc: 'Increase max health' },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-sky-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black italic text-white tracking-tighter">TECH UPGRADES</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-400 font-bold">Credits: {state.coins}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgradeItems.map((item) => {
            const level = state.upgrades[item.type];
            const cost = getCost(level);
            const canAfford = state.coins >= cost;

            return (
              <div key={item.type} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between group hover:border-sky-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-white font-bold">{item.label}</h3>
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-bold">LVL {level}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{item.desc}</p>
                </div>
                
                <button
                  disabled={!canAfford}
                  onClick={() => onUpgrade(item.type)}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    canAfford 
                      ? 'bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-900/20' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg>
                  {cost} CREDITS
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
          <button 
            onClick={onClose}
            className="px-12 py-3 bg-white text-black font-black italic tracking-widest rounded-xl hover:bg-sky-400 transition-all active:scale-95"
          >
            RETURN TO COMBAT
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
