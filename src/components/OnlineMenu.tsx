
import React from 'react';
import { Socket } from 'socket.io-client';

interface OnlineMenuProps {
    isConnected: boolean;
    roomCode: string;
    playerName: string;
    setPlayerName: (name: string) => void;
    connectedPlayers: { name: string, index: number }[];
    myOnlineIndex: number;
    isHost: boolean;
    isConnecting: boolean;
    inputCode: string;
    setInputCode: (code: string) => void;
    createOnlineRoom: () => void;
    joinOnlineRoom: () => void;
    startOnlineMatchAsHost: () => void;
    copyCodeToClipboard: () => void;
    setView: (view: 'menu' | 'rules' | 'game' | 'online_menu') => void;
    setRoomCode: (code: string) => void;
    setConnectedPlayers: (players: { name: string, index: number }[]) => void;
    socket: Socket;
}

const OnlineMenu: React.FC<OnlineMenuProps> = ({
    isConnected,
    roomCode,
    playerName,
    setPlayerName,
    connectedPlayers,
    myOnlineIndex,
    isHost,
    isConnecting,
    inputCode,
    setInputCode,
    createOnlineRoom,
    joinOnlineRoom,
    startOnlineMatchAsHost,
    copyCodeToClipboard,
    setView,
    setRoomCode,
    setConnectedPlayers,
    socket
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 w-full max-w-sm">
            <h2 className="text-3xl font-cinzel text-amber-500 font-bold mb-8 text-center tracking-widest drop-shadow-md">Modalità Online</h2>
            <div className={`mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border ${isConnected ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isConnected ? 'Server Connesso' : 'Server Non Raggiungibile'}
            </div>

            <div className="w-full bg-[#113a22] rounded-3xl p-6 shadow-2xl border border-white/5 flex flex-col gap-6">
                {/* Player Name Input - Premium Section */}
                {!roomCode && (
                    <div className="animate-fade-in bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                        <label className="text-[10px] text-amber-500/60 uppercase font-black tracking-widest mb-2 block ml-1">Il tuo Nome</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Inserisci nome..."
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                maxLength={15}
                                className="w-full bg-[#0a2f1b] border-2 border-amber-500/20 focus:border-amber-500/60 rounded-xl py-3 px-4 text-white font-bold placeholder:text-white/20 transition-all outline-none shadow-lg focus:shadow-amber-500/10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl opacity-40">👤</div>
                        </div>
                    </div>
                )}

                {roomCode ? (
                    // LOBBY VIEW
                    <div className="animate-fade-in">
                        <div className="bg-[#1e4e30] rounded-xl p-6 text-center border border-white/10 relative mb-4">
                            <div className="text-xs text-white/60 mb-2 font-bold uppercase tracking-wider">Stanza d'attesa</div>
                            <div className="text-4xl font-bold text-amber-400 tracking-[0.2em] mb-4 font-mono select-all bg-black/20 rounded py-2 cursor-pointer border border-amber-500/30 hover:border-amber-500 transition-colors" onClick={copyCodeToClipboard} title="Clicca per copiare">
                                {roomCode}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <div className="text-[10px] text-white/40 uppercase tracking-widest text-left pl-2">Giocatori ({connectedPlayers.length}/3):</div>
                                {connectedPlayers.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                                        <div className={`w-2 h-2 rounded-full ${p.index === myOnlineIndex ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                                        <span className="text-sm font-bold text-white">{p.name} {p.index === 0 ? '(Host)' : ''} {p.index === myOnlineIndex ? '(Tu)' : ''}</span>
                                    </div>
                                ))}
                                {[...Array(3 - connectedPlayers.length)].map((_, i) => (
                                    <div key={`empty-${i}`} className="flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg border border-white/5 border-dashed opacity-50">
                                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                        <span className="text-sm italic text-white/30">In attesa...</span>
                                    </div>
                                ))}
                            </div>

                            {isHost ? (
                                <button onClick={startOnlineMatchAsHost} className="w-full py-3 bg-amber-600 text-white text-sm font-bold uppercase rounded-xl shadow-lg hover:bg-amber-500 transition-all border-b-4 border-amber-800 active:translate-y-1">Avvia Partita</button>
                            ) : (
                                <div className="text-center py-2">
                                    <div className="text-amber-500 text-xs font-bold uppercase animate-pulse">L'host sta per iniziare...</div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => { setRoomCode(""); setConnectedPlayers([]); socket.emit('disconnect_game'); }} className="w-full py-3 bg-red-900/50 hover:bg-red-800/50 text-red-200 font-bold rounded-xl border border-red-500/30 transition-colors uppercase text-xs tracking-widest">Esci dalla stanza</button>
                    </div>
                ) : (
                    // SELECTION VIEW
                    <div className="animate-fade-in space-y-6">
                        <div>
                            <h3 className="text-amber-500 font-bold text-lg mb-2">Crea Stanza</h3>
                            <button onClick={createOnlineRoom} disabled={isConnecting} className="w-full py-3 bg-gradient-to-b from-[#fcd34d] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-black font-black uppercase tracking-widest rounded-xl shadow-lg border-b-4 border-amber-600 active:translate-y-1 transition-all disabled:opacity-50">{isConnecting ? '...' : 'Crea nuova partita'}</button>
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] uppercase font-bold tracking-widest">Oppure</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <div>
                            <h3 className="text-amber-500 font-bold text-lg mb-2">Entra in Stanza</h3>
                            <div className="flex flex-col gap-2">
                                <input type="text" maxLength={4} placeholder="CODICE" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} disabled={isConnecting} className="w-full bg-[#0a2f1b] border border-amber-500/30 rounded-xl py-3 px-4 text-center text-white tracking-widest uppercase font-bold focus:outline-none focus:border-amber-500 transition-colors" />
                                <button onClick={joinOnlineRoom} disabled={isConnecting || !inputCode} className="w-full py-3 bg-[#2d5c43] hover:bg-[#366b4f] text-white font-bold rounded-xl shadow border-b-4 border-[#1e422f] active:translate-y-1 transition-all disabled:opacity-50 uppercase tracking-widest">Entra</button>
                            </div>
                        </div>

                        <button onClick={() => setView('menu')} className="mt-4 w-full py-3 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">← Torna al menù</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineMenu;
