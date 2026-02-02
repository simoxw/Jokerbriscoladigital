
import React from 'react';
import { TrickRecord } from '../types';
import { getSuitIcon } from '../constants';

interface HistoryPanelProps {
  history: TrickRecord[];
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl p-6 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-2xl font-cinzel text-amber-500 font-bold tracking-widest">CRONOLOGIA</h2>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em]">Andamento della partita</p>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-2xl text-white/60 hover:text-white transition-colors"
        >
          &times;
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {history.length > 0 ? (
          history.map((trick, index) => (
            <div 
              key={index} 
              className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 transition-all hover:bg-white/[0.07]"
            >
              {/* Round Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">
                  Mano #{trick.round}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase font-bold">Vincitore:</span>
                  <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg shadow-amber-500/20">
                    {trick.winnerName.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Plays Grid */}
              <div className="grid grid-cols-1 gap-2">
                {trick.plays.map((play, pIdx) => (
                  <div key={pIdx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${play.playerId === 0 ? 'bg-amber-400' : 'bg-white/20'}`}></span>
                      <span className="text-white/60 font-semibold">{play.playerName}:</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-lg">{getSuitIcon(play.card.suit)}</span>
                      <span className="text-white font-bold">{play.card.label}</span>
                      <span className="text-white/30 text-[10px]">({play.card.value} pt)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Points Summary */}
              <div className="pt-1 flex justify-end">
                <span className="text-[11px] font-bold text-green-400/80 bg-green-400/10 px-3 py-1 rounded-full">
                  Totale presa: +{trick.points} punti
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
            <span className="text-6xl">📝</span>
            <p className="text-sm font-bold uppercase tracking-widest text-center">
              Nessuna giocata registrata.<br/>La partita è appena iniziata!
            </p>
          </div>
        )}
      </div>
      
      {/* Footer Button */}
      <button 
        onClick={onClose} 
        className="mt-6 py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all border-b-4 border-amber-800 active:translate-y-1"
      >
        Chiudi
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default HistoryPanel;
