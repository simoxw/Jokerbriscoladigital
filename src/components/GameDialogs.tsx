
import React from 'react';
import { MatchState } from '../types';

interface GameDialogsProps {
    matchState: MatchState;
    gameMode: 'OFFLINE' | 'ONLINE';
    isHost: boolean;
    message: string;
    showRestartConfirm: boolean;
    setShowRestartConfirm: (show: boolean) => void;
    startNewMatch: (mode: 'OFFLINE' | 'ONLINE', resetTotalScores?: boolean) => void;
    startOnlineMatchAsHost: () => void;
    completeTrick: (winnerId: number) => void;
    setView: (view: 'menu' | 'rules' | 'game' | 'online_menu') => void;
    socket: any;
}

const GameDialogs: React.FC<GameDialogsProps> = ({
    matchState,
    gameMode,
    isHost,
    message,
    showRestartConfirm,
    setShowRestartConfirm,
    startNewMatch,
    startOnlineMatchAsHost,
    completeTrick,
    setView,
    socket
}) => {
    return (
        <>
            {/* Trick Collection Button (Offline) */}
            {gameMode === 'OFFLINE' && matchState.waitingForNextTrick && matchState.tempWinnerId !== null && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                    <button
                        onClick={() => completeTrick(matchState.tempWinnerId!)}
                        className="bg-amber-500 text-black font-black uppercase text-sm py-4 px-10 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] border-4 border-white animate-pulse hover:scale-105 transition-transform active:scale-95"
                    >
                        Raccogli
                    </button>
                </div>
            )}

            {/* Restart Confirmation Dialog */}
            {showRestartConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-fade-in">
                    <div className="bg-[#042614] border-2 border-blue-500 rounded-3xl p-8 w-full max-w-xs shadow-2xl text-center">
                        <h2 className="text-2xl font-cinzel text-blue-400 font-bold mb-4">Riavvia Partita?</h2>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    if (gameMode === 'ONLINE') {
                                        if (isHost) startOnlineMatchAsHost();
                                        else alert("Solo l'host può riavviare.");
                                    } else {
                                        startNewMatch('OFFLINE');
                                    }
                                    setShowRestartConfirm(false);
                                }}
                                className="py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest transition-all"
                            >
                                Sì, Riavvia
                            </button>
                            <button
                                onClick={() => setShowRestartConfirm(false)}
                                className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest text-slate-400 transition-all"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over / Match End Dialog */}
            {matchState.phase === 'MATCH_END' && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 z-[150]">
                    <h2 className="text-4xl font-cinzel text-amber-500 font-bold mb-4 text-center tracking-widest">FINE MANO</h2>
                    <div className="text-2xl text-white mb-10 text-center">{message}</div>
                    {(gameMode === 'OFFLINE' || isHost) ? (
                        <button
                            onClick={() => gameMode === 'ONLINE' ? startOnlineMatchAsHost() : startNewMatch('OFFLINE')}
                            className="w-full max-w-xs py-5 bg-amber-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-500 transition-all border-b-4 border-amber-800 active:translate-y-1"
                        >
                            Prossima Mano
                        </button>
                    ) : (
                        <div className="text-white/50 text-sm animate-pulse">In attesa dell'Host...</div>
                    )}
                    <button
                        onClick={() => {
                            setView('menu');
                            if (gameMode === 'ONLINE') socket.emit('disconnect_game');
                        }}
                        className="mt-6 text-white/60 uppercase font-bold hover:text-white transition-colors"
                    >
                        Menu Iniziale
                    </button>
                </div>
            )}
        </>
    );
};

export default GameDialogs;
