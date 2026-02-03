
import React from 'react';

interface MainMenuProps {
    startNewMatch: (mode: 'OFFLINE' | 'ONLINE', resetTotalScores: boolean) => void;
    goToOnlineMenu: () => void;
    setView: (view: 'menu' | 'rules' | 'game' | 'online_menu') => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ startNewMatch, goToOnlineMenu, setView }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8 p-6 text-center w-full max-w-sm">
            <div className="w-40 h-40 bg-amber-500/20 rounded-full flex items-center justify-center border-4 border-amber-500 shadow-[0_0_40px_rgba(251,191,36,0.4)] animate-pulse">
                <span className="text-7xl">🃏</span>
            </div>
            <h1 className="text-4xl font-cinzel font-bold text-amber-500 tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">JOKER BRISCOLA</h1>
            <div className="flex flex-col gap-3 w-full">
                <button onClick={() => startNewMatch('OFFLINE', true)} className="py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl font-bold text-lg shadow-xl transition-all uppercase tracking-widest border-b-4 border-amber-800">Gioca Offline</button>
                <button onClick={goToOnlineMenu} className="py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl font-bold text-lg shadow-xl transition-all uppercase tracking-widest border-b-4 border-amber-800">Modalità Online</button>
                <button onClick={() => setView('rules')} className="py-4 bg-green-900/40 border border-white/10 hover:bg-green-800/40 rounded-2xl font-bold text-lg transition-all uppercase tracking-widest">Regolamento</button>
            </div>
        </div>
    );
};

export default MainMenu;
