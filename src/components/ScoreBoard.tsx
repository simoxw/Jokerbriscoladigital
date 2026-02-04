
import React from 'react';
import { PlayerData } from '../types';

interface ScoreBoardProps {
  players: PlayerData[];
  type: 'total' | 'match';
  myIndex?: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, type, myIndex = 0 }) => {
  const isMatch = type === 'match';

  return (
    <div className={`flex flex-col justify-center bg-black/40 px-3 py-1 rounded border border-white/5 w-full h-[48%] ${isMatch ? 'bg-green-900/30' : ''}`}>
      <div className="text-[9px] font-bold text-amber-500/80 uppercase tracking-wider mb-0.5 border-b border-white/10 pb-0.5 text-center">
        {isMatch ? 'Punti Mano' : 'Torneo'}
      </div>
      <div className="flex justify-around items-center text-[10px]">
        {players.map(p => (
          <div key={p.id} className="flex flex-col items-center leading-none">
            <span className="text-slate-400 scale-90 origin-bottom mb-0.5">{p.index === myIndex ? 'TU' : p.name.toUpperCase()}</span>
            <span className={`font-mono font-bold text-xs ${p.index === myIndex ? 'text-amber-400' : 'text-white'}`}>
              {isMatch ? p.pointsInMatch : p.totalScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
