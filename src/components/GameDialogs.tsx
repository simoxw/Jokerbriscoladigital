
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
    startOnlineMatchAsHost: (resetTotalScores?: boolean) => void;
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
                <div className="absolute bottom-[18cqw] left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={() => completeTrick(matchState.tempWinnerId!)}
                        className="bg-amber-500 text-black font-black uppercase text-sm py-3 px-8 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] border-4 border-white animate-pulse hover:scale-105 transition-transform active:scale-95"
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

            {/* Tournament Winner Dialog */}
            {matchState.phase === 'TOURNAMENT_WIN' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 z-[200] animate-fade-in">
                    <div className="text-6xl mb-6 animate-bounce">🏆</div>
                    <h2 className="text-5xl font-cinzel text-amber-500 font-bold mb-2 text-center tracking-[0.3em] drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">CAMPIONE</h2>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 my-8 w-full max-w-sm flex flex-col items-center shadow-2xl">
                        <div className="text-3xl font-black text-white mb-6 uppercase tracking-widest text-center">
                            {matchState.players.sort((a, b) => b.totalScore - a.totalScore)[0].name}
                        </div>

                        <div className="w-full flex flex-col gap-3">
                            {matchState.players.sort((a, b) => b.totalScore - a.totalScore).map((p, idx) => (
                                <div key={p.id} className={`flex justify-between items-center p-3 rounded-xl ${idx === 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}`}>
                                    <span className="font-bold text-white/80">{p.name}</span>
                                    <span className="text-2xl font-black text-amber-500">{p.totalScore}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(gameMode === 'OFFLINE' || isHost) ? (
                        <button
                            onClick={() => gameMode === 'ONLINE' ? startOnlineMatchAsHost(true) : startNewMatch('OFFLINE', true)}
                            className="w-full max-w-xs py-5 bg-amber-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(217,119,6,0.4)] hover:bg-amber-500 transition-all border-b-4 border-amber-800 active:translate-y-1"
                        >
                            Nuovo Torneo
                        </button>
                    ) : (
                        <div className="text-amber-500/50 text-sm animate-pulse font-bold tracking-widest uppercase">In attesa dell'Host per la rivincita...</div>
                    )}

                    <button
                        onClick={() => {
                            setView('menu');
                            if (gameMode === 'ONLINE') socket.emit('disconnect_game');
                        }}
                        className="mt-10 text-white/40 uppercase font-black tracking-widest hover:text-white transition-colors text-xs"
                    >
                        Esci al Menu
                    </button>
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
