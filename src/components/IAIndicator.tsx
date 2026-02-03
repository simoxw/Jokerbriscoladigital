
import React, { memo } from 'react';
import { PlayerData } from '../types';

interface IAIndicatorProps {
    player: PlayerData;
    isTurn: boolean;
    isWinner: boolean;
}

const IAIndicator: React.FC<IAIndicatorProps> = ({ player, isTurn, isWinner }) => {
    if (!player) return <div className="w-12"></div>;

    return (
        <div className={`relative flex flex-col items-center transition-all duration-300 ${isTurn ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}`}>
            {isWinner && <div className="absolute -top-4 text-2xl animate-bounce z-10 drop-shadow-md">👑</div>}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-lg mb-1 ${isTurn ? 'border-amber-400 bg-amber-500 text-black shadow-amber-500/40' : 'border-white/10 bg-white/5 text-white/40'}`}>
                {player.name.substring(0, 2).toUpperCase()}
            </div>
            <div className={`text-[8px] font-black uppercase tracking-widest ${isTurn ? 'text-amber-400' : 'text-white/30'}`}>
                {player.name}
            </div>
        </div>
    );
};

// Memoization: re-render only if critical props change
export default memo(IAIndicator, (prev, next) => {
    return (
        prev.isTurn === next.isTurn &&
        prev.isWinner === next.isWinner &&
        prev.player.id === next.player.id &&
        prev.player.name === next.player.name
    );
});
