
import React from 'react';
import { PlayerData } from '../types';

interface ScoreBoardProps {
  players: PlayerData[];
  type: 'total' | 'match';
  myIndex?: number;
  variant?: 'horizontal' | 'vertical';
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, type, myIndex = 0, variant = 'horizontal' }) => {
  const isMatch = type === 'match';
  const isVertical = variant === 'vertical';

  if (isVertical) {
    return (
      <div
        className={`flex flex-col bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl w-full animate-fade-in`}
        style={{ padding: '1.5cqw' }}
      >
        <div
          className="text-amber-500 font-black uppercase tracking-widest border-b border-white/10 text-center whitespace-nowrap"
          style={{ fontSize: '2.2cqw', marginBottom: '1cqw', paddingBottom: '0.5cqw' }}
        >
          PUNTI MANO
        </div>
        <div className="flex flex-col gap-1 w-full">
          {players.map((p) => (
            <div key={p.id} className="flex justify-between items-center w-full">
              <span
                className={`font-black uppercase tracking-tighter ${p.index === myIndex ? 'text-blue-400' : 'text-slate-300'}`}
                style={{ fontSize: '2.6cqw' }}
              >
                {p.index === myIndex ? 'TU' : p.name.toUpperCase()}:
              </span>
              <span className="text-white font-bold tabular-nums" style={{ fontSize: '3.0cqw' }}>{p.pointsInMatch}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className={`flex flex-col justify-center bg-black/40 px-[2cqw] py-[1cqw] rounded-[0.5cqw] border border-white/5 w-full h-full min-h-0 flex-shrink ${isMatch ? 'bg-green-900/30' : ''}`}>
      <div className="text-[2.0cqw] font-bold text-amber-500/80 uppercase tracking-wider mb-[0.5cqw] border-b border-white/10 pb-[0.5cqw] text-center leading-none">
        {isMatch ? 'Punti Mano' : 'Torneo'}
      </div>
      <div className="flex justify-around items-center text-[2.2cqw] mt-[0.5cqw]">
        {players.map(p => (
          <div key={p.id} className="flex flex-col items-center leading-none">
            <span className="text-slate-400 mb-[0.5cqw] text-[1.8cqw] uppercase tracking-tighter">{p.index === myIndex ? 'TU' : p.name.toUpperCase()}</span>
            <span className={`font-mono font-bold text-[2.8cqw] ${p.index === myIndex ? 'text-amber-400' : 'text-white'}`}>
              {isMatch ? p.pointsInMatch : p.totalScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;

