
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
      ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/40 animate-pulse'
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
      return 'border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] ring-1 ring-amber-400 z-10';
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
        {isWinner(playerId) && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce z-50">👑</div>}

        <div className={`w-full aspect-[2/3] border rounded-lg bg-black/40 flex items-center justify-center shadow-2xl transition-all duration-500 relative ${getCardContainerStyle(playerId)}`}>
          {card ? (
            <div className="w-full h-full p-0.5">
              <ItalianCard card={card} isFluid />
            </div>
          ) : (
            <div className="text-[8px] text-amber-500 font-bold opacity-10 uppercase tracking-tighter">{positionLabel}</div>
          )}
        </div>

        <div className="flex flex-col items-center leading-none mt-1 h-8 justify-start">
          <span className={`text-[9px] font-bold truncate max-w-full ${isTurn ? 'text-amber-400' : 'text-amber-500/40'}`}>{playerName}</span>
          <RoleBadge role={p.role} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col flex-1 relative overflow-hidden">

      {/* 1. TABLE AREA */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-2 min-h-[260px]">

        {/* Lead Suit Indicator */}
        {leadSuit && !waitingForNextTrick && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 animate-fade-in z-0">
            <span className="text-[8px] uppercase font-bold text-white/40 tracking-widest">Mano:</span>
            <span className="text-xs">{getSuitIcon(leadSuit)}</span>
          </div>
        )}

        {/* Central Play Area */}
        <div className="w-full max-w-[340px] aspect-square rounded-[40px] relative flex items-center justify-center">

          {/* Center Deck Counter (Handwritten Style) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0 transform -rotate-12">
            <div className="font-[cursive] text-red-500/90 text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              MAZZO: {deckCount}
            </div>
          </div>

          {/* Player Slots positioned around */}
          <div className="absolute w-full h-full p-3 grid grid-cols-3 grid-rows-2 z-10">
            {/* Row 1: Left (Next) & Right (Prev) */}
            <div className="col-start-1 row-start-1 flex items-center justify-center pr-2 pt-24">
              {renderSlot(leftIndex, leftPlayer.name, 'SX')}
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-center pl-2 pt-24">
              {renderSlot(rightIndex, rightPlayer.name, 'DX')}
            </div>

            {/* Row 2: Me (Center Bottom) */}
            <div className="col-start-2 row-start-2 flex items-end justify-center -mb-4">
              {renderSlot(myIndex, 'TU', 'TU')}
            </div>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="h-8 w-full flex items-center justify-center mt-2 z-20">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[3px] flex items-center justify-center gap-2 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Tocca a <span className={`${turnIndex === myIndex ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>{turnIndex === myIndex ? 'TE' : players.find(p => p.id === turnIndex)?.name}</span>
          </div>
        </div>
      </div>

      {/* 2. HAND AREA */}
      <div className={`bg-[#02120a] pb-4 pt-2 px-2 border-t border-white/10 mt-4 transition-opacity duration-300 relative z-30 ${waitingForNextTrick ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-center gap-2 h-32 items-end">
          {me.hand.map((card) => (
            <div key={card.id} className={`transform transition-all duration-300 w-24 h-40 ${turnIndex === myIndex ? 'hover:-translate-y-4 cursor-pointer active:scale-95' : 'opacity-80'}`}>
              <ItalianCard
                card={card}
                isFluid
                onClick={() => onCardClick(card)}
                disabled={turnIndex !== myIndex || game.phase !== 'PLAYING' || game.playedCards.length === 3 || waitingForNextTrick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameTable;
