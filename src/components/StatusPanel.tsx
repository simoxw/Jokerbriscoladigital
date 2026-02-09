
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
      {/* Dynamic Message */}
      <div className={`bg-black/70 backdrop-blur-md px-[2.5cqw] py-[1.5cqw] rounded-[1.5cqw] border transition-all duration-500 shadow-2xl ${isSpecial ? 'border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/20' : 'border-white/10'
        }`}>
        <div className={`text-[2.2cqw] font-bold min-w-[20cqw] max-w-[35cqw] text-left transition-all tracking-tight whitespace-normal leading-tight ${isSpecial ? 'text-amber-400 animate-pulse' : 'text-slate-100'
          }`}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
