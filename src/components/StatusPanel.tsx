
import React from 'react';
import { MatchState } from '../types';

interface StatusPanelProps {
  game: MatchState;
  message: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ game, message }) => {
  const isSpecial = message.includes("JOKER") || message.includes("VINTO");

  return (
    <div className="flex flex-col items-start gap-[1cqw] z-10 pointer-events-none">
      {/* Round Info - Prima riga */}
      <div className="bg-black/60 backdrop-blur-md px-[2cqw] py-[1cqw] rounded-[1.5cqw] border border-white/10 shadow-xl flex items-center gap-[2cqw]">
        <span className="text-[1.8cqw] font-black text-slate-500 uppercase tracking-widest leading-none">Mano</span>
        <span className="text-[3.2cqw] font-cinzel font-bold text-amber-400 leading-none">{game.roundCount}<span className="text-[2cqw] text-white/30 font-sans mx-[0.5cqw]">/</span>13</span>
      </div>

      {/* Dynamic Message - Seconda riga */}
      <div className={`bg-black/70 backdrop-blur-md px-[2.5cqw] py-[1.5cqw] rounded-[1.5cqw] border transition-all duration-500 shadow-2xl ${isSpecial ? 'border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/20' : 'border-white/10'
        }`}>
        <div className={`text-[2.8cqw] font-bold min-w-[20cqw] text-left transition-all tracking-tight whitespace-nowrap ${isSpecial ? 'text-amber-400 animate-pulse' : 'text-slate-100'
          }`}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
