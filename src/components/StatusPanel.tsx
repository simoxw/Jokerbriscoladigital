
import React from 'react';
import { MatchState } from '../types';

interface StatusPanelProps {
  game: MatchState;
  message: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ game, message }) => {
  const isSpecial = message.includes("JOKER") || message.includes("VINTO");

  return (
    <div className="flex items-center gap-4 z-10 pointer-events-none transform scale-75 sm:scale-100 origin-center">
      <div className={`bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-2xl border transition-all duration-500 flex items-center gap-3 shadow-2xl ${isSpecial ? 'border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/20' : 'border-white/10'
        }`}>

        {/* Round Info */}
        <div className="flex flex-col items-center border-r border-white/10 pr-3">
          <span className="text-[6px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-0.5">Mano</span>
          <span className="text-sm font-cinzel font-bold text-amber-400">{game.roundCount}<span className="text-[9px] text-white/30 font-sans mx-0.5">/</span>13</span>
        </div>

        {/* Dynamic Message */}
        <div className={`text-[10px] font-bold min-w-[120px] text-center transition-all ${isSpecial ? 'text-amber-400 animate-pulse tracking-wide' : 'text-slate-200'
          }`}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
