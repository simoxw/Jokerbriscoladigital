import React, { useState } from 'react';
import { Card } from '../types';
import { getSuitIcon, getSuitColor } from '../constants';

interface ItalianCardProps {
  card: Card;
  onClick?: () => void;
  isHidden?: boolean;
  isSmall?: boolean;
  isFluid?: boolean;
  disabled?: boolean;
  rotation?: number;
}

const ItalianCard: React.FC<ItalianCardProps> = ({ card, onClick, isHidden, isSmall, isFluid, disabled, rotation = 0 }) => {
  const [imgError, setImgError] = useState(false);

  // Determina la base del percorso (vuota in locale, '/Jokerbriscoladigital/' su GitHub)
  const baseUrl = import.meta.env.BASE_URL;

  let sizeClasses = "";
  if (isFluid) {
    sizeClasses = "w-full h-full";
  } else if (isSmall) {
    sizeClasses = "w-16 h-24 text-xs";
  } else {
    sizeClasses = "w-24 h-36 text-sm";
  }

  const rotationStyle = rotation ? { transform: `rotate(${rotation}deg)` } : {};

  if (isHidden) {
    return (
      <div
        className={`${sizeClasses} bg-slate-800 rounded-xl border-2 border-amber-600/30 flex items-center justify-center shadow-2xl overflow-hidden`}
        style={rotationStyle}
      >
        <div className="w-full h-full border-4 border-slate-900 rounded-lg bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_8px,#0f172a_8px,#0f172a_16px)]"></div>
      </div>
    );
  }

  const suitIcon = getSuitIcon(card.suit);
  const suitColor = getSuitColor(card.suit);

  // SOLUZIONE FINALE: baseUrl aggiunge automaticamente il prefisso necessario
  const imagePath = `${baseUrl}assets/cards/${card.suit}/${card.rank}.webp`;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={rotationStyle}
      className={`
        ${sizeClasses}
        relative bg-[#f8fafc] text-slate-900 rounded-xl border-[3px] border-amber-900/40 
        flex flex-col items-center shadow-2xl cursor-pointer overflow-hidden
        transition-all duration-300
        ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-110 hover:border-amber-500 hover:shadow-amber-500/20'}
      `}
    >
      {!imgError ? (
        <img
          src={imagePath}
          alt={card.label}
          className="w-full h-full object-fill"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col p-1">
          <div className="absolute inset-1 border border-amber-900/10 rounded-lg pointer-events-none"></div>
          <div className="w-full flex justify-between px-1 font-bold">
            <span className="leading-none">{card.rank === 1 ? 'A' : card.rank === 3 ? '3' : card.rank >= 8 ? card.label[0] : card.rank}</span>
            <span className={`${suitColor} leading-none`}>{suitIcon}</span>
          </div>
          <div className="flex-1 w-full flex flex-col items-center justify-center gap-1">
            <div className="text-4xl opacity-10 absolute">{suitIcon}</div>
            <div className="w-10 h-10 rounded-full border border-amber-900/5 bg-amber-500/5 flex items-center justify-center text-2xl">
              {suitIcon}
            </div>
          </div>
          <div className="w-full flex justify-between px-1 font-bold rotate-180">
            <span className="leading-none">{card.rank === 1 ? 'A' : card.rank === 3 ? '3' : card.rank >= 8 ? card.label[0] : card.rank}</span>
            <span className={`${suitColor} leading-none`}>{suitIcon}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItalianCard;