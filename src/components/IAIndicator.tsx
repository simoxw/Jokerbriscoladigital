
import React, { memo } from 'react';
import { PlayerData } from '../types';

interface IAIndicatorProps {
    player: PlayerData;
    isTurn: boolean;
    isWinner: boolean;
}

const IAIndicator: React.FC<IAIndicatorProps> = ({ player, isTurn, isWinner }) => {
    if (!player) return <div className="w-[6cqw]"></div>;

    return (
        <div className={`relative flex flex-col items-center transition-all duration-300 ${isTurn ? 'opacity-100 z-20' : 'opacity-40 z-10'}`}>
            {isWinner && <div className="absolute -top-[40%] text-[4.5cqw] animate-bounce z-50 drop-shadow-lg pointer-events-none">👑</div>}
            <div className={`w-[6.5cqw] h-[6.5cqw] rounded-full flex items-center justify-center font-bold border-[0.3cqw] shadow-md ${isTurn ? 'border-amber-400 bg-amber-500 text-black shadow-amber-500/40' : 'border-white/10 bg-white/5 text-white/40'}`}>
                <span className="text-[2cqw]">{player.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className={`text-[1.5cqw] font-black uppercase tracking-wider mt-[0.3cqw] ${isTurn ? 'text-amber-400' : 'text-white/20'}`}>
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
