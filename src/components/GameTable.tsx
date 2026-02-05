
import React from 'react';
import { MatchState, Card, PlayerRole } from '../types';
import ItalianCard from './ItalianCard';
import { getSuitIcon } from '../constants';

interface GameTableProps {
  game: MatchState;
  onCardClick: (card: Card) => void;
  myPlayerId?: number;
}

const RoleBadge = ({ role }: { role: PlayerRole }) => {
  if (role === 'NONE') return null;
  const isJoker = role === 'JOKER';
  return (
    <div className={`mt-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter shadow-sm border transition-all ${isJoker
      ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-fuchsia-500/40 animate-pulse'
      : 'bg-blue-600 text-white border-blue-400 opacity-80'
      }`}>
      {role === 'JOKER' ? '🃏 JOKER' : '🛡️ ALLEATO'}
    </div>
  );
};

const GameTable: React.FC<GameTableProps> = ({ game, onCardClick, myPlayerId = 0 }) => {
  const { players, playedCards, turnIndex, tempWinnerId, waitingForNextTrick, leadSuit, deckCount } = game;

  const myIndex = myPlayerId;
  // SENSO ORARIO:
  // Il giocatore SUCCESSIVO a me (myIndex + 1) deve stare a SINISTRA visivamente (o in alto a sx).
  // Il giocatore PRECEDENTE a me (myIndex + 2) deve stare a DESTRA visivamente (o in alto a dx).
  // Flusso: Tu (basso) -> Sinistra -> Destra -> Tu.

  const leftIndex = (myPlayerId + 1) % 3;  // Next Player
  const rightIndex = (myPlayerId + 2) % 3; // Previous Player

  const me = players.find(p => p.id === myIndex)!;
  const rightPlayer = players.find(p => p.id === rightIndex)!;
  const leftPlayer = players.find(p => p.id === leftIndex)!;

  const getPlayedCard = (playerId: number) => {
    return playedCards.find(pc => pc.playerId === playerId)?.card;
  };

  const isWinner = (playerId: number) => {
    return waitingForNextTrick && tempWinnerId === playerId;
  };

  const getCardContainerStyle = (playerId: number) => {
    const isWin = isWinner(playerId);
    const hasCard = !!getPlayedCard(playerId);
    const isJoker = players.find(p => p.id === playerId)?.role === 'JOKER';

    if (isWin) {
      return 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.8)] scale-110 z-20 bg-amber-900/20';
    }
    if (isJoker && hasCard) {
      // Usiamo una tonalità Viola/Fucsia per il Joker per distinguerlo dall'Oro del vincitore
      return 'border-fuchsia-500 shadow-[0_0_25px_rgba(192,38,211,0.6)] ring-1 ring-fuchsia-400 z-10 animate-card-pop';
    }
    if (hasCard) {
      return 'border-white/5 animate-card-pop';
    }
    return 'border-white/5';
  };

  const renderSlot = (playerId: number, playerName: string, positionLabel: string) => {
    const p = players.find(pl => pl.id === playerId);
    if (!p) return null;

    const card = getPlayedCard(playerId);
    const isTurn = turnIndex === playerId;

    return (
      <div className="flex flex-col items-center justify-end gap-1 relative h-full">

        <div className={`w-full aspect-[2/3] border rounded-lg bg-black/40 flex items-center justify-center shadow-2xl transition-all duration-500 relative ${getCardContainerStyle(playerId)}`}
          style={{ width: 'clamp(75px, 28vmin, 110px)' }}>
          {card ? (
            <div className="w-full h-full p-0.5" style={{ transform: `rotate(${(card.id * 13) % 10 - 5}deg)` }}>
              <ItalianCard card={card} isFluid />
            </div>
          ) : (
            <div className="text-[8px] text-amber-500 font-bold opacity-10 uppercase tracking-tighter">{positionLabel}</div>
          )}
        </div>

        <div className="flex flex-col items-center leading-none mt-1 h-8 justify-start">
          <div className="flex items-center gap-1">
            {isWinner(playerId) && <span className="text-xs animate-bounce">👑</span>}
            <span className={`text-[9px] font-bold truncate max-w-full ${isTurn ? 'text-amber-400' : 'text-amber-500/40'}`}>{playerName}</span>
            {isWinner(playerId) && <span className="text-xs animate-bounce">👑</span>}
          </div>
          <RoleBadge role={p.role} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col flex-1 relative overflow-hidden">

      {/* 1. TABLE AREA - Fills available space, can shrink if needed */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-2 min-h-0 flex-shrink overflow-visible">

        {/* Lead Suit Indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5 animate-fade-in z-0">
          <span className="text-[7px] uppercase font-bold text-white/40 tracking-widest">Mano:</span>
          <span className="text-[10px]">{getSuitIcon(leadSuit)}</span>
        </div>

        {/* Central Play Area - Using relative max-w to ensure it fits any screen */}
        <div className="w-full max-w-[85vmin] aspect-square rounded-[40px] relative flex items-center justify-center flex-shrink min-h-0">

          {/* Deck Counter - Relocated and scaled - Lowered further for balance */}
          <div className="absolute top-[8vh] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 scale-90 origin-top">
            <div className="flex flex-col items-center gap-1 bg-black/45 px-2 py-0.5 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
              {/* Compact Card Stack Icon */}
              <div className="relative w-4 h-6 mb-0.5">
                <div className="absolute inset-0 bg-amber-800/40 border border-amber-600/30 rounded-sm translate-x-[1px] translate-y-[1px]"></div>
                <div className="absolute inset-0 bg-amber-700/60 border border-amber-500/40 rounded-sm"></div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] uppercase font-black text-amber-500/50 tracking-[1px]">Mazzo</span>
                <span className="text-sm font-bold text-white tabular-nums leading-none">{deckCount}</span>
              </div>
            </div>
          </div>

          {/* Player Slots positioned around - Elevated z-index to be above status row if they overlap */}
          <div className="absolute w-full h-full p-3 grid grid-cols-3 grid-rows-2 z-40 pointer-events-none">
            {/* Row 1: Left (Next) & Right (Prev) - Shifted outwards and DOWNWARDS to clear filters */}
            <div className="col-start-1 row-start-1 flex items-center justify-center -translate-x-4 pt-[12vh]">
              {renderSlot(leftIndex, leftPlayer.name, 'SX')}
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-center translate-x-4 pt-[12vh]">
              {renderSlot(rightIndex, rightPlayer.name, 'DX')}
            </div>

            {/* Row 2: Me (Center Bottom) - Positioned relative to allow side turn indicator */}
            <div className="col-start-2 row-start-2 flex items-end justify-center -mb-2 relative">
              {renderSlot(myIndex, 'TU', 'TU')}

              {/* Turn Indicator - Relocated BESIDE me to save vertical space */}
              <div className="absolute left-[calc(100%+8px)] bottom-8 z-20 pointer-events-none whitespace-nowrap origin-left">
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[2px] flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[7px] text-white/40 mb-0.5">Tocca a</span>
                    <span className={`text-[10px] ${turnIndex === myIndex ? 'text-amber-400 font-black' : 'text-slate-200 font-bold'}`}>
                      {turnIndex === myIndex ? 'TE' : players.find(p => p.id === turnIndex)?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Turn Indicator - MOVED ABOVE to the side of TU slot */}
      </div>

      {/* 2. HAND AREA - Fixed bottom, dynamic card sizes - Top z-index */}
      <div className={`bg-[#02120a] pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 px-1.5 border-t border-white/10 transition-opacity duration-300 relative z-50 flex-shrink-0 ${waitingForNextTrick ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-center gap-1 items-end max-w-full min-h-0">
          {me.hand.map((card, idx) => {
            const isNewCard = card.id > (game.roundCount * 10);
            return (
              <div
                key={card.id}
                className={`transform transition-all duration-500 ${turnIndex === myIndex
                  ? 'cursor-pointer active:scale-95 animate-turn-glow rounded-xl [@media(hover:hover)]:hover:-translate-y-8 [@media(hover:hover)]:hover:scale-110 [@media(hover:hover)]:hover:z-50'
                  : 'opacity-80'
                  } ${isNewCard ? 'animate-card-draw' : ''}`}
                style={{
                  width: 'clamp(65px, 24vmin, 105px)',
                  aspectRatio: '2/3',
                  animationDelay: isNewCard ? `${idx * 0.1}s` : undefined,
                  flexShrink: 1
                }}
              >
                <ItalianCard
                  card={card}
                  isFluid
                  onClick={() => onCardClick(card)}
                  disabled={turnIndex !== myIndex || game.phase !== 'PLAYING' || game.playedCards.length === 3 || waitingForNextTrick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameTable;
