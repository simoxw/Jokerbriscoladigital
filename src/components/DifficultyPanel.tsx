
import React from 'react';
import { AIDifficulty } from '../types';

interface DifficultyPanelProps {
  current: AIDifficulty;
  onSelect: (diff: AIDifficulty) => void;
  onClose: () => void;
}

const DifficultyPanel: React.FC<DifficultyPanelProps> = ({ current, onSelect, onClose }) => {
  return (
    <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[#042614] border-2 border-amber-500 rounded-3xl p-8 w-full max-w-xs shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in">
        <h2 className="text-2xl font-cinzel text-amber-500 font-bold mb-6 text-center tracking-widest uppercase">Strategia IA</h2>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => onSelect('BASE')}
            className={`py-4 rounded-xl font-bold transition-all text-left px-5 relative overflow-hidden ${current === 'BASE' ? 'bg-amber-600 text-white border-2 border-white/20 shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'}`}
          >
            <div className="flex justify-between items-center">
               <span>BASE</span>
               {current === 'BASE' && <span className="text-xs">✓</span>}
            </div>
            <div className="text-[10px] font-normal mt-1 opacity-70 leading-tight">L'IA gioca con buone basi. Non spreca carichi inutilmente e cerca di vincere le mani con punti.</div>
          </button>
          
          <button 
            onClick={() => onSelect('ESPERTO')}
            className={`py-4 rounded-xl font-bold transition-all text-left px-5 relative overflow-hidden ${current === 'ESPERTO' ? 'bg-amber-600 text-white border-2 border-white/20 shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'}`}
          >
            <div className="flex justify-between items-center">
               <span>ESPERTO</span>
               {current === 'ESPERTO' && <span className="text-xs">✓</span>}
            </div>
            <div className="text-[10px] font-normal mt-1 opacity-70 leading-tight">L'IA ragiona sui ruoli. Gli alleati collaborano tra loro, caricano i compagni e contrastano il Joker strategicamente.</div>
          </button>
        </div>
        
        <button onClick={onClose} className="mt-8 text-white/40 text-xs font-black uppercase w-full tracking-widest hover:text-white transition-colors">Torna al Gioco</button>
      </div>
    </div>
  );
};

export default DifficultyPanel;
