import React from 'react';
import { MatchState, Card, PlayerRole } from '../types';
import ItalianCard from './ItalianCard';
import { getSuitIcon } from '../constants';
import ScoreBoard from './ScoreBoard';
import StatusPanel from './StatusPanel';

interface GameTableProps {
  game: MatchState;
  onCardClick: (card: Card) => void;
  myPlayerId?: number;
  message: string;
}

const RoleBadge = ({ role }: { role: PlayerRole }) => {


  if (role === 'NONE') return null;
  const isJoker = role === 'JOKER';
  return (
    <div className={`mt-[1cqw] px-[1.5cqw] py-[0.5cqw] rounded-[0.5cqw] text-[1.4cqw] font-black uppercase tracking-tighter shadow-sm border transition-all ${isJoker
      ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-fuchsia-500/40 animate-pulse'
      : 'bg-blue-600 text-white border-blue-400 opacity-80'
      }`}>
      {role === 'JOKER' ? '🃏 JOKER' : '🛡️ ALLEATO'}
    </div>
  );
};

const GameTable: React.FC<GameTableProps> = ({ game, onCardClick, myPlayerId = 0, message }) => {
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
      <div className="flex flex-col items-center justify-center gap-[1cqw] relative h-full">

        <div className={`aspect-[2/3] border rounded-[1.5cqw] bg-black/40 flex items-center justify-center shadow-2xl transition-all duration-500 relative ${getCardContainerStyle(playerId)}`}
          style={{ width: 'var(--card-w-table)' }}>
          {card ? (
            <div className="w-full h-full p-[0.3cqw]" style={{ transform: `rotate(${(card.id * 13) % 10 - 5}deg)` }}>
              <ItalianCard card={card} />
            </div>
          ) : (
            <div className="text-[1.5cqw] text-amber-500 font-bold opacity-10 uppercase tracking-tighter">{positionLabel}</div>
          )}
        </div>

        <div className="flex flex-col items-center leading-none mt-[1cqw] h-[6cqw] justify-start">
          <div className="flex items-center gap-[0.5cqw]">
            {isWinner(playerId) && <span className="text-[2cqw] animate-bounce">👑</span>}
            <span className={`text-[1.8cqw] font-bold truncate max-w-full ${isTurn ? 'text-amber-400' : 'text-amber-500/40'}`}>{playerName}</span>
            {isWinner(playerId) && <span className="text-[2cqw] animate-bounce">👑</span>}
          </div>
          <RoleBadge role={p.role} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col flex-1 relative overflow-hidden">

      {/* 1. TABLE AREA - Vertical rectangle to fill tall screens (95% height/width) */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-[2cqw] pb-[3cqw] min-h-0 flex-shrink overflow-visible">

        {/* Lead Suit Indicator */}
        <div className="absolute top-[1cqw] left-1/2 -translate-x-1/2 bg-white/5 px-[2cqw] py-[0.5cqw] rounded-full border border-white/10 flex items-center gap-[1.5cqw] animate-fade-in z-0">
          <span className="text-[1.5cqw] uppercase font-bold text-white/40 tracking-widest">Mano:</span>
          <span className="text-[2.5cqw]">{getSuitIcon(leadSuit)}</span>
        </div>

        {/* Central Play Area - ELASTIC RECTANGLE - Proportional to screen height */}
        <div className="w-[95%] h-[95%] max-w-[95cqw] max-h-[75vh] relative flex items-center justify-center flex-shrink min-h-0 transition-all duration-500">

          {/* Riquadro Punti Mano - Posizione Mobile (Unica) */}
          <div className="absolute left-[-2%] bottom-[12%] w-[25%] z-50 pointer-events-none">
            <ScoreBoard players={players} type="match" myIndex={myPlayerId} variant="vertical" />
          </div>


          {/* Deck Counter - Responsive Position */}
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 transition-all">
            <div className="flex flex-col items-center gap-[1cqw] bg-black/45 px-[2cqw] py-[0.5cqw] rounded-[2cqw] border border-white/10 backdrop-blur-md shadow-xl">
              {/* Compact Card Stack Icon */}
              <div className="relative w-[3cqw] h-[4.5cqw] mb-[0.5cqw]">
                <div className="absolute inset-0 bg-amber-800/40 border border-amber-600/30 rounded-[0.5cqw] translate-x-[0.2cqw] translate-y-[0.2cqw]"></div>
                <div className="absolute inset-0 bg-amber-700/60 border border-amber-500/40 rounded-[0.5cqw]"></div>
              </div>
              <div className="flex items-center gap-[1cqw]">
                <span className="text-[1.5cqw] uppercase font-black text-amber-500/50 tracking-[1px]">Mazzo</span>
                <span className="text-[3cqw] font-bold text-white tabular-nums leading-none">{deckCount}</span>
              </div>
            </div>
          </div>

          {/* Player Slots Grid - Spreads out vertically in the rectangle */}
          <div className="absolute w-full h-full p-0 grid grid-cols-3 grid-rows-2 z-50 pointer-events-none">
            {/* Row 1: Left (Next) & Right (Prev) - Shifted to edges */}
            <div className="col-start-1 row-start-1 flex items-center justify-start pt-[15%]">
              {renderSlot(leftIndex, leftPlayer.name, 'IA1')}
            </div>
            <div className="col-start-3 row-start-1 flex items-center justify-end pt-[15%]">
              {renderSlot(rightIndex, rightPlayer.name, 'IA2')}
            </div>

            {/* Row 2: Me (Center Bottom) */}
            <div className="col-start-2 row-start-2 flex items-end justify-center pb-[5%] relative">
              {renderSlot(myIndex, 'TU', 'TU')}

              {/* StatusPanel e Turn Indicator - Posizione Mobile (Unica) */}
              <div className="absolute left-[calc(100%+3cqw)] bottom-[10cqw] z-20 pointer-events-none flex flex-col items-start gap-[1cqw] transition-all">
                {/* StatusPanel (Mano su Messaggio) */}
                <StatusPanel game={game} message={message} />

                {/* Turn Indicator (Fumetto) - Sotto lo StatusPanel */}
                <div className="text-[2cqw] font-bold text-white/30 uppercase tracking-tighter flex items-center gap-[1.5cqw] bg-black/65 px-[3cqw] py-[2cqw] rounded-[3cqw] backdrop-blur-md border border-white/10 shadow-2xl whitespace-nowrap">
                  <span className="w-[1.5cqw] h-[1.5cqw] rounded-full bg-amber-500 animate-pulse"></span>
                  <div className="flex flex-col items-start leading-none gap-[0.5cqw]">
                    <span className="text-[1.2cqw] text-white/40">Tocca a</span>
                    <span className={`text-[2.2cqw] ${turnIndex === myIndex ? 'text-amber-400 font-black' : 'text-slate-200 font-bold'}`}>
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

      <div className={`bg-[#02120a] pb-[5cqw] pt-[2cqw] px-[2cqw] border-t border-white/10 transition-all duration-300 relative z-50 flex-shrink-0 ${waitingForNextTrick ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-center gap-[0.5cqw] items-end max-w-full min-h-0">
          {me.hand.map((card, idx) => {
            const isNewCard = card.id > (game.roundCount * 10);
            return (
              <div
                key={card.id}
                className={`transform transition-all duration-500 ${turnIndex === myIndex
                  ? 'cursor-pointer active:scale-95 animate-turn-glow rounded-[2cqw] [@media(hover:hover)]:hover:-translate-y-[10cqw] [@media(hover:hover)]:hover:scale-110 [@media(hover:hover)]:hover:z-50'
                  : 'opacity-80'
                  } ${isNewCard ? 'animate-card-draw' : ''}`}
                style={{
                  width: 'var(--card-w-hand)',
                  aspectRatio: '2/3',
                  animationDelay: isNewCard ? `${idx * 0.1}s` : undefined,
                  flexShrink: 1,
                  marginLeft: '0'
                }}
              >
                <ItalianCard
                  card={card}
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
