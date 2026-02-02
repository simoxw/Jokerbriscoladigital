
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MatchState, PlayerData, Card, AIDifficulty, TrickRecord } from './types';
import { createDeck, getSuitIcon } from './constants';
import { calculateBestMove } from './ai';
import GameTable from './components/GameTable';
import StatusPanel from './components/StatusPanel';
import ScoreBoard from './components/ScoreBoard';
import HistoryPanel from './components/HistoryPanel';
import DifficultyPanel from './components/DifficultyPanel';
import ItalianCard from './components/ItalianCard';

// Configurazione Socket.IO
const socket: Socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['polling', 'websocket'],
  timeout: 10000
});

const IAIndicator = ({ player, isTurn, isWinner }: { player: PlayerData, isTurn: boolean, isWinner: boolean }) => {
  if (!player) return <div className="w-12"></div>;
  
  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 ${isTurn ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}`}>
       {isWinner && <div className="absolute -top-4 text-2xl animate-bounce z-10 drop-shadow-md">👑</div>}
       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-lg mb-1 ${isTurn ? 'border-amber-400 bg-amber-500 text-black shadow-amber-500/40' : 'border-white/10 bg-white/5 text-white/40'}`}>
          {player.name.substring(0, 2).toUpperCase()}
       </div>
       <div className={`text-[8px] font-black uppercase tracking-widest ${isTurn ? 'text-amber-400' : 'text-white/30'}`}>
          {player.name}
       </div>
    </div>
  );
};

const updateRoles = (jokerId: number, players: PlayerData[]): PlayerData[] => players.map(p => ({ ...p, role: p.id === jokerId ? 'JOKER' : 'ALLY' }));

// Helper function to calculate next state without React state setter
const applyCardPlay = (prev: MatchState, card: Card, playerId: number): { newState: MatchState, message: string } => {
  let newJokerId = prev.jokerPlayerId;
  let newPlayers = [...prev.players];
  let msg = "";

  if (newJokerId === null && card.suit === prev.briscolaSuit) {
    newJokerId = playerId;
    newPlayers = updateRoles(playerId, newPlayers);
    const pName = prev.players.find(p => p.id === playerId)?.name || '';
    msg = `${pName.toUpperCase()} È IL JOKER! 🃏`;
  }
  
  const updatedPlayers = newPlayers.map(p => p.id === playerId ? { ...p, hand: p.hand.filter(c => c.id !== card.id), handSize: p.handSize - 1 } : p);
  
  const newState: MatchState = { 
    ...prev, 
    players: updatedPlayers, 
    playedCards: [...prev.playedCards, { playerId, card }], 
    turnIndex: (prev.turnIndex + 1) % 3, 
    jokerPlayerId: newJokerId, 
    leadSuit: prev.playedCards.length === 0 ? card.suit : prev.leadSuit 
  };

  return { newState, message: msg };
};

const App: React.FC = () => {
  const [view, setView] = useState<'menu' | 'rules' | 'game' | 'online_menu'>('menu');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [message, setMessage] = useState("Benvenuto!");
  
  const [showHistory, setShowHistory] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('BASE');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [gameMode, setGameMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [connectedPlayers, setConnectedPlayers] = useState<{name: string, index: number}[]>([]);
  const [myOnlineIndex, setMyOnlineIndex] = useState<number>(0); 
  const isHost = myOnlineIndex === 0;

  const myPlayerNameRef = useRef("Tu");
  const myOnlineIndexRef = useRef(0); // Ref per usare il valore aggiornato nei listener

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      console.log("Socket Connesso con ID:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    socket.on('room_created', ({ code, myIndex }) => {
      setRoomCode(code);
      setMyOnlineIndex(myIndex);
      myOnlineIndexRef.current = myIndex; // Aggiorna ref
      setConnectedPlayers([{ name: myPlayerNameRef.current, index: myIndex }]);
      setIsConnecting(false);
    });

    socket.on('room_joined', ({ code, myIndex, players, gameState }) => {
      setRoomCode(code);
      setMyOnlineIndex(myIndex);
      myOnlineIndexRef.current = myIndex; // Aggiorna ref
      if (players) setConnectedPlayers(players);
      if (gameState) {
         setMatchState(gameState);
         setView('game');
      }
      setIsConnecting(false);
    });

    socket.on('update_players', (players) => {
      setConnectedPlayers(players);
    });

    socket.on('error_message', (msg) => {
      alert(msg);
      setIsConnecting(false);
    });

    socket.on('game_started', (initialState: MatchState) => {
      console.log('[CLIENT] 🎮 game_started ricevuto:', initialState);
      setMatchState(initialState);
      setView('game');
      setMessage(`Briscola è ${getSuitIcon(initialState.briscola!.suit)} ${initialState.briscola!.suit}`);
      setShowRestartConfirm(false); 
    });

    socket.on('remote_play', ({ card, playerId }) => {
      const currentMyIndex = myOnlineIndexRef.current;
      console.log('[CLIENT] 🎴 remote_play ricevuto da:', playerId, 'myIndex:', currentMyIndex, card);
      
      // Ignora se la mossa è nostra (non dovrebbe succedere ma aggiungiamo sicurezza)
      if (playerId === currentMyIndex) {
        console.log('[CLIENT] ⚠️  Ignorato remote_play da noi stessi');
        return;
      }
      
      // Standard local update for human remote moves
      setMatchState(prev => {
        if (!prev) return null;
        const { newState, message: msg } = applyCardPlay(prev, card, playerId);
        if (msg) setMessage(msg);
        return newState;
      });
    });

    // NEW: Handle full state sync from AI move
    socket.on('ai_remote_play', ({ card, playerId, gameState }) => {
      console.log('[CLIENT] 🤖 ai_remote_play ricevuto da:', playerId, card, 'stato:', gameState);
      setMatchState(gameState);
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        setMessage(`${player.name} ha giocato ${card.label}`);
      }
    });

    // NEW: Handle full state sync generally
    socket.on('sync_game_state', (state: MatchState) => {
      console.log('[CLIENT] 🔄 sync_game_state ricevuto:', state);
      setMatchState(state);
      
      // Aggiorna anche il messaggio in base allo stato ricevuto
      if (state.waitingForNextTrick && state.tempWinnerId !== null) {
        const winner = state.players.find(p => p.id === state.tempWinnerId);
        if (winner) {
          const trickPoints = state.playedCards.reduce((acc, pc) => acc + pc.card.value, 0);
          setMessage(`Presa: ${winner.name} (+${trickPoints})`);
        }
      } else if (state.phase === 'MATCH_END') {
        const joker = state.players.find(p => p.role === 'JOKER');
        if (joker) {
          const jokerScore = joker.pointsInMatch;
          if (jokerScore >= 51) setMessage(`Il Joker Vince! (${jokerScore} pt)`);
          else setMessage(`Alleati Vincono! (${120 - jokerScore} pt)`);
        } else {
          setMessage("Partita Nulla");
        }
      }
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('update_players');
      socket.off('error_message');
      socket.off('game_started');
      socket.off('remote_play');
      socket.off('ai_remote_play');
      socket.off('sync_game_state');
    };
  }, []); 

  const goToOnlineMenu = () => {
    setView('online_menu');
    setGameMode('ONLINE');
    setRoomCode("");
    setConnectedPlayers([]);
    setInputCode("");
    setIsConnecting(false);
    if (!socket.connected) socket.connect();
  };

  const createOnlineRoom = () => {
    if (isConnecting) return;
    setIsConnecting(true);
    if (!socket.connected) socket.connect();
    
    const name = "Player 1 (Host)";
    myPlayerNameRef.current = name;
    socket.emit('create_room', name);
    setTimeout(() => setIsConnecting(false), 5000);
  };

  const joinOnlineRoom = () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (cleanCode.length !== 4) {
      alert("Il codice deve essere di 4 caratteri");
      return;
    }
    
    setIsConnecting(true);
    if (!socket.connected) socket.connect();
    
    const name = `Ospite_${Math.floor(Math.random() * 100)}`;
    myPlayerNameRef.current = name;
    
    // Reset previous room state just in case
    setRoomCode("");
    setConnectedPlayers([]);
    
    socket.emit('join_room', { code: cleanCode, name });
    setTimeout(() => setIsConnecting(false), 5000);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    alert(`Codice ${roomCode} copiato!`);
  };

  const startOnlineMatchAsHost = () => {
    if (!isHost) return;
    const deck = createDeck();
    
    const p2IsHuman = connectedPlayers.find(p => p.index === 1);
    const p3IsHuman = connectedPlayers.find(p => p.index === 2);

    const h1 = deck.splice(0, 3);
    const h2 = deck.splice(0, 3);
    const h3 = deck.splice(0, 3);
    const briscola = deck.pop(); 

    const players: PlayerData[] = [
      { id: 0, name: connectedPlayers.find(p => p.index === 0)?.name || 'Host', index: 0, handSize: 3, hand: h1, role: 'NONE', pointsInMatch: 0, totalScore: 0, capturedCards: [] },
      { id: 1, name: p2IsHuman ? p2IsHuman.name : 'IA1', index: 1, handSize: 3, hand: h2, role: 'NONE', pointsInMatch: 0, totalScore: 0, capturedCards: [] },
      { id: 2, name: p3IsHuman ? p3IsHuman.name : 'IA2', index: 2, handSize: 3, hand: h3, role: 'NONE', pointsInMatch: 0, totalScore: 0, capturedCards: [] },
    ];
    
    const initialState: MatchState = {
      players,
      deck,
      deckCount: deck.length,
      briscola: briscola!,
      briscolaSuit: briscola?.suit,
      playedCards: [],
      turnIndex: 0,
      jokerPlayerId: null,
      phase: 'PLAYING',
      roundCount: 1,
      lastCard: briscola,
      difficulty: difficulty,
      waitingForNextTrick: false,
      tempWinnerId: null,
      history: []
    };

    socket.emit('start_game', { code: roomCode, initialGameState: initialState });
  };

  const startNewMatch = useCallback((mode: 'OFFLINE' | 'ONLINE' = 'OFFLINE', resetTotalScores = false) => {
    if (mode === 'ONLINE') return; 

    const deck = createDeck();
    const prevPlayers = matchState?.players;
    
    const h1 = deck.splice(0, 3);
    const h2 = deck.splice(0, 3);
    const h3 = deck.splice(0, 3);
    const briscola = deck.pop(); 

    const players: PlayerData[] = [
      { id: 0, name: 'Tu', index: 0, handSize: 3, hand: h1, role: 'NONE', pointsInMatch: 0, totalScore: resetTotalScores ? 0 : (prevPlayers?.[0].totalScore || 0), capturedCards: [] },
      { id: 1, name: 'IA1', index: 1, handSize: 3, hand: h2, role: 'NONE', pointsInMatch: 0, totalScore: resetTotalScores ? 0 : (prevPlayers?.[1].totalScore || 0), capturedCards: [] },
      { id: 2, name: 'IA2', index: 2, handSize: 3, hand: h3, role: 'NONE', pointsInMatch: 0, totalScore: resetTotalScores ? 0 : (prevPlayers?.[2].totalScore || 0), capturedCards: [] },
    ];

    setMatchState({
      players,
      deck,
      deckCount: deck.length,
      briscola: briscola!,
      briscolaSuit: briscola?.suit,
      playedCards: [],
      turnIndex: 0,
      jokerPlayerId: null,
      phase: 'PLAYING',
      roundCount: 1,
      lastCard: briscola,
      difficulty: difficulty,
      waitingForNextTrick: false,
      tempWinnerId: null,
      history: []
    });
    setGameMode(mode);
    setMyOnlineIndex(0); 
    setView('game');
    setShowRestartConfirm(false);
    setMessage(`Briscola è ${getSuitIcon(briscola!.suit)} ${briscola!.suit}`);
  }, [difficulty, matchState]);

  const evaluateTrick = (played: { playerId: number; card: Card }[], briscolaSuit: string, leadSuit: string) => {
    let winner = played[0];
    for (let i = 1; i < played.length; i++) {
      const current = played[i];
      const winCard = winner.card;
      const curCard = current.card;
      if (curCard.suit === briscolaSuit && winCard.suit !== briscolaSuit) winner = current;
      else if (curCard.suit === winCard.suit) {
        if (curCard.value > winCard.value) winner = current;
        else if (curCard.value === winCard.value && curCard.rank > winCard.rank) winner = current;
      } else if (curCard.suit === leadSuit && winCard.suit !== briscolaSuit) {
        if (curCard.value > winCard.value) winner = current;
      }
    }
    return winner.playerId;
  };

  const completeTrick = useCallback((winnerId: number) => {
    setMatchState(prev => {
      if (!prev) return null;
      
      const trickPoints = prev.playedCards.reduce((acc, pc) => acc + pc.card.value, 0);
      const trickCards = prev.playedCards.map(pc => pc.card);
      const winnerName = prev.players.find(p => p.id === winnerId)?.name || 'Qualcuno';
      const playsWithNames = prev.playedCards.map(pc => ({ playerId: pc.playerId, playerName: prev.players.find(p => p.id === pc.playerId)?.name || '?', card: pc.card }));
      const newHistoryRecord: TrickRecord = { round: prev.roundCount, plays: playsWithNames, winnerId, winnerName, points: trickPoints };
      
      let nextDeck = [...prev.deck];
      let nextBriscola = prev.briscola;
      const tempHands: { [id: number]: Card[] } = {};
      prev.players.forEach(p => tempHands[p.id] = [...p.hand]);

      const drawOrder = [winnerId, (winnerId + 1) % 3, (winnerId + 2) % 3];

      drawOrder.forEach(pid => {
         if (nextDeck.length > 0) {
            const drawn = nextDeck.shift(); 
            if (drawn) tempHands[pid].push(drawn);
         } 
         else if (nextBriscola) {
            tempHands[pid].push(nextBriscola);
            nextBriscola = null; 
         }
      });

      let updatedPlayers = prev.players.map(p => {
        const isWinner = p.id === winnerId;
        const newHand = tempHands[p.id];
        return { ...p, hand: newHand, handSize: newHand.length, pointsInMatch: isWinner ? p.pointsInMatch + trickPoints : p.pointsInMatch, capturedCards: isWinner ? [...p.capturedCards, ...trickCards] : p.capturedCards };
      });

      const isGameOver = updatedPlayers.every(p => p.handSize === 0);
      let nextMessage = `Presa: ${winnerName} (+${trickPoints})`;
      let matchResult: 'JOKER_WIN' | 'ALLY_WIN' | 'NULL' = 'NULL';

      if (isGameOver) {
        const joker = updatedPlayers.find(p => p.role === 'JOKER');
        if (joker) {
           const jokerScore = joker.pointsInMatch;
           const alliesScore = 120 - jokerScore; 
           if (jokerScore >= 51) matchResult = 'JOKER_WIN';
           else if (alliesScore >= 71) matchResult = 'ALLY_WIN';
           else matchResult = 'NULL';
        } else {
           matchResult = 'NULL';
        }

        updatedPlayers = updatedPlayers.map(p => {
           if (matchResult === 'JOKER_WIN' && p.role === 'JOKER') return { ...p, totalScore: p.totalScore + 2 };
           if (matchResult === 'ALLY_WIN' && p.role === 'ALLY') return { ...p, totalScore: p.totalScore + 1 };
           return p; 
        });

        if (matchResult === 'JOKER_WIN') nextMessage = `Il Joker Vince! (${joker?.pointsInMatch} pt)`;
        else if (matchResult === 'ALLY_WIN') nextMessage = `Alleati Vincono! (${120 - (joker?.pointsInMatch || 0)} pt)`;
        else nextMessage = "Partita Nulla";
      }

      const newState: MatchState = { 
          ...prev, 
          players: updatedPlayers, 
          deck: nextDeck, 
          deckCount: nextDeck.length, 
          briscola: nextBriscola, 
          playedCards: [], 
          turnIndex: winnerId, 
          leadSuit: undefined, 
          roundCount: prev.roundCount + 1, 
          phase: isGameOver ? 'MATCH_END' : 'PLAYING', 
          waitingForNextTrick: false, 
          tempWinnerId: null, 
          history: [...prev.history, newHistoryRecord] 
      };

      setMessage(nextMessage);

      // Only Host sends the definitive game state update
      if (gameMode === 'ONLINE' && isHost) {
         console.log('[CLIENT] 📡 Host invia update_game_state dopo completamento trick:', newState);
         socket.emit('update_game_state', { code: roomCode, state: newState });
      }

      return newState;
    });
  }, [gameMode, isHost, roomCode]);

  const handleLocalCardPlayed = useCallback((card: Card) => {
    if (!matchState) return;
    if (gameMode === 'ONLINE' && matchState.turnIndex !== myOnlineIndex) return;
    if (gameMode === 'OFFLINE' && matchState.turnIndex !== 0) return;
    
    // Process local move
    setMatchState(prev => {
        if (!prev) return null;
        const { newState, message: msg } = applyCardPlay(prev, card, gameMode === 'ONLINE' ? myOnlineIndex : 0);
        if (msg) setMessage(msg);
        return newState;
    });

    if (gameMode === 'ONLINE') socket.emit('play_card', { code: roomCode, card, playerId: myOnlineIndex });
  }, [matchState, gameMode, myOnlineIndex, roomCode]);

  // AI TURN LOGIC (Offline & Online Host)
  useEffect(() => {
    if (!matchState || matchState.phase !== 'PLAYING' || matchState.waitingForNextTrick) return;
    if (matchState.playedCards.length === 3) {
      const winnerId = evaluateTrick(matchState.playedCards, matchState.briscolaSuit!, matchState.leadSuit!);
      setMatchState(prev => prev ? ({ ...prev, tempWinnerId: winnerId, waitingForNextTrick: true }) : null);
      return;
    }
    
    const currentPlayer = matchState.players[matchState.turnIndex];
    let isAITurn = false;
    
    if (gameMode === 'OFFLINE') {
        isAITurn = matchState.turnIndex !== 0;
    } else if (gameMode === 'ONLINE' && isHost) {
        const isOnlineHuman = connectedPlayers.some(p => p.index === matchState.turnIndex);
        if (!isOnlineHuman && matchState.turnIndex !== 0) {
            isAITurn = true;
        }
    }
    
    if (isAITurn) {
      const timer = setTimeout(() => {
        const card = calculateBestMove(matchState, currentPlayer.id);
        
        console.log('[CLIENT] 🤖 IA gioca:', currentPlayer.name, card);
        
        // Calculate new state logic
        const { newState, message: msg } = applyCardPlay(matchState, card, currentPlayer.id);
        
        // Update local state
        setMatchState(newState);
        if (msg) setMessage(msg);

        // If online host, sync full state immediately
        if (gameMode === 'ONLINE' && isHost) {
            console.log('[CLIENT] 📡 Host invia ai_play_card:', { playerId: currentPlayer.id, card, gameState: newState });
            socket.emit('ai_play_card', { 
              code: roomCode, 
              card, 
              playerId: currentPlayer.id, 
              gameState: newState 
            });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [matchState, gameMode, isHost, connectedPlayers, roomCode]);

  useEffect(() => {
    if (matchState?.waitingForNextTrick && matchState.tempWinnerId !== null && gameMode === 'ONLINE' && isHost) {
         console.log('[CLIENT] ⏰ Host completerà trick tra 3 secondi, vincitore:', matchState.tempWinnerId);
         const timer = setTimeout(() => {
           console.log('[CLIENT] 🧹 Host completa trick e sincronizza stato');
           completeTrick(matchState.tempWinnerId!);
         }, 3000);
         return () => clearTimeout(timer);
    }
  }, [matchState?.waitingForNextTrick, matchState?.tempWinnerId, gameMode, isHost, completeTrick]);

  return (
    // Updated background to a lighter, professional green gradient
    <div className="min-h-screen bg-gradient-to-br from-[#1e453e] to-[#0b2922] text-white font-sans flex flex-col items-center overflow-hidden">
      
      {view === 'menu' && (
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
      )}

      {view === 'online_menu' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 w-full max-w-sm">
          <h2 className="text-3xl font-cinzel text-amber-500 font-bold mb-8 text-center tracking-widest drop-shadow-md">Modalità Online</h2>
          <div className={`mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border ${isConnected ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Server Connesso' : 'Server Non Raggiungibile'}
          </div>
          
          <div className="w-full bg-[#113a22] rounded-3xl p-6 shadow-2xl border border-white/5 flex flex-col gap-6">
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
                       <input type="text" maxLength={4} placeholder="CODICE" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} disabled={isConnecting} className="w-full bg-[#0a2f1b] border border-amber-500/30 rounded-xl py-3 px-4 text-center text-white tracking-widest uppercase font-bold focus:outline-none focus:border-amber-500 transition-colors"/>
                       <button onClick={joinOnlineRoom} disabled={isConnecting || !inputCode} className="w-full py-3 bg-[#2d5c43] hover:bg-[#366b4f] text-white font-bold rounded-xl shadow border-b-4 border-[#1e422f] active:translate-y-1 transition-all disabled:opacity-50 uppercase tracking-widest">Entra</button>
                    </div>
                  </div>
                  
                  <button onClick={() => setView('menu')} className="mt-4 w-full py-3 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">← Torna al menù</button>
                </div>
             )}
          </div>
        </div>
      )}
      
      {view === 'rules' && (
         <div className="flex flex-col h-screen w-full max-w-md bg-[#042614] text-slate-200 overflow-hidden relative">
           <div className="p-6 pb-2 border-b border-white/10 shrink-0 bg-[#042614] z-10">
              <h2 className="text-3xl font-cinzel text-amber-500 font-bold tracking-widest">Regolamento</h2>
              <button onClick={() => setView('menu')} className="mt-4 w-full py-2 bg-amber-600 rounded font-bold uppercase">Torna al Menu</button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                 <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Obiettivo</h3>
                 <p className="text-sm leading-relaxed text-slate-300">
                    Il gioco si svolge in 3 giocatori. È una sfida tutti contro tutti con ruoli nascosti.
                    <br/><br/>
                    <strong className="text-white">JOKER:</strong> Gioca da solo. Vince se totalizza almeno <strong className="text-amber-400">51 punti</strong>.
                    <br/>
                    <strong className="text-white">ALLEATI:</strong> Giocano in coppia. Vincono se totalizzano insieme almeno <strong className="text-blue-400">71 punti</strong>.
                 </p>
              </section>

              <section>
                 <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Ruoli</h3>
                 <p className="text-sm leading-relaxed text-slate-300">
                    A inizio partita viene estratta una <strong className="text-amber-400">Briscola</strong> visibile a tutti.
                    <br/><br/>
                    Il <strong className="text-amber-500">JOKER</strong> è colui che gioca per primo una carta del seme di Briscola. Fino a quel momento, i ruoli sono segreti!
                    <br/>
                    Gli altri due giocatori sono gli <strong className="text-blue-400">ALLEATI</strong> e devono collaborare per impedire al Joker di fare punti, ma senza sapere chi è il compagno all'inizio.
                 </p>
              </section>

              <section>
                 <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Valore Carte</h3>
                 <ul className="text-sm space-y-2 text-slate-300">
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Asso (1)</span> <span className="font-bold text-white">11 punti</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Tre (3)</span> <span className="font-bold text-white">10 punti</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Re (10)</span> <span className="font-bold text-white">4 punti</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Cavallo (9)</span> <span className="font-bold text-white">3 punti</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span>Fante (8)</span> <span className="font-bold text-white">2 punti</span></li>
                    <li className="flex justify-between"><span>Scartine (2, 4, 5, 6, 7)</span> <span className="font-bold text-white/50">0 punti</span></li>
                 </ul>
              </section>

              <section>
                 <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Svolgimento</h3>
                 <p className="text-sm leading-relaxed text-slate-300">
                    Si distribuiscono 13 carte a testa (l'ultima è la Briscola in tavola).
                    A turno, ogni giocatore cala una carta.
                    <br/>
                    Regole di presa classiche della Briscola:
                    <ul className="list-disc list-inside mt-2 pl-2 space-y-1 text-xs text-slate-400">
                       <li>Vince la carta di Briscola più alta.</li>
                       <li>Se non c'è Briscola, vince la carta del seme di uscita più alta.</li>
                    </ul>
                 </p>
              </section>
           </div>
         </div>
      )}

      {view === 'game' && matchState && (
         <div className="relative w-full min-h-screen flex flex-col max-w-[420px] pb-4 bg-transparent">
             <div className="p-2 bg-black/40 backdrop-blur-md z-30 flex flex-col gap-2 shadow-2xl border-b border-white/10 relative">
                
                {/* Briscola: Positioned Absolute Top-Right, Larger */}
                <div className="absolute top-2 right-2 flex flex-col items-center bg-black/30 p-1.5 rounded-lg border border-white/10 shadow-xl z-20">
                   <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-0.5 leading-none">Briscola</span>
                   <div className="w-20 h-32">
                      {matchState.briscola ? (
                         <ItalianCard card={matchState.briscola} isFluid />
                      ) : (
                         <div className="w-full h-full border border-dashed border-white/20 rounded flex items-center justify-center bg-white/5">
                            <span className="text-[6px] text-white/30">Finito</span>
                         </div>
                      )}
                   </div>
                </div>

                {/* Header Row: Buttons */}
                <div className="flex justify-between items-start mb-2 pr-16"> 
                   <div className="flex gap-2">
                     <button onClick={() => setShowHistory(true)} className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-amber-400 text-white" title="Cronologia">📊</button>
                     <button onClick={() => setShowDifficulty(true)} className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-amber-400 text-white" title="IA">⚙️</button>
                     <button onClick={() => setShowRestartConfirm(true)} className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg border border-blue-400 text-white transition-colors" title="Riavvia">🔄</button>
                     <button onClick={() => { setView('menu'); if(gameMode === 'ONLINE') socket.emit('disconnect_game'); }} className="w-9 h-9 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center shadow-lg border border-red-400 text-white font-bold" title="Esci">ESC</button>
                   </div>
                </div>

                {/* Info Row: Scoreboards (Narrower width to accommodate Briscola) */}
                <div className="flex flex-col gap-1 w-[58%] z-10">
                   <div className="w-full h-12"><ScoreBoard players={matchState.players} type="match" /></div>
                   {gameMode === 'ONLINE' && <div className="text-center text-blue-300 text-[8px] uppercase font-bold">Room: {roomCode}</div>}
                   <div className="w-full h-12"><ScoreBoard players={matchState.players} type="total" /></div>
                </div>
             </div>
             
             <div className="py-3 px-3 flex justify-between items-start w-full gap-2 relative z-20">
                <IAIndicator player={matchState.players[(myOnlineIndex + 1) % 3]} isTurn={matchState.turnIndex === (myOnlineIndex + 1) % 3} isWinner={matchState.waitingForNextTrick && matchState.tempWinnerId === (myOnlineIndex + 1) % 3} />
                <div className="flex-1 flex justify-center"><StatusPanel game={matchState} message={message} /></div>
                <IAIndicator player={matchState.players[(myOnlineIndex + 2) % 3]} isTurn={matchState.turnIndex === (myOnlineIndex + 2) % 3} isWinner={matchState.waitingForNextTrick && matchState.tempWinnerId === (myOnlineIndex + 2) % 3} />
             </div>

             <div className="flex-1 relative flex flex-col justify-end overflow-hidden">
                <GameTable game={matchState} onCardClick={handleLocalCardPlayed} myPlayerId={myOnlineIndex} />
                {gameMode === 'OFFLINE' && matchState.waitingForNextTrick && matchState.tempWinnerId !== null && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                      <button onClick={() => completeTrick(matchState.tempWinnerId!)} className="bg-amber-500 text-black font-black uppercase text-sm py-4 px-10 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] border-4 border-white animate-pulse hover:scale-105 transition-transform active:scale-95">Raccogli</button>
                   </div>
                )}
             </div>
             
             {showHistory && <HistoryPanel history={matchState.history} onClose={() => setShowHistory(false)} />}
             {showDifficulty && <DifficultyPanel current={difficulty} onSelect={(d) => { setDifficulty(d); setShowDifficulty(false); }} onClose={() => setShowDifficulty(false)} />}
             
             {showRestartConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-fade-in">
                   <div className="bg-[#042614] border-2 border-blue-500 rounded-3xl p-8 w-full max-w-xs shadow-2xl text-center">
                      <h2 className="text-2xl font-cinzel text-blue-400 font-bold mb-4">Riavvia Partita?</h2>
                      <div className="flex flex-col gap-3">
                         <button onClick={() => { if (gameMode === 'ONLINE') { if (isHost) startOnlineMatchAsHost(); else alert("Solo l'host può riavviare."); } else { startNewMatch('OFFLINE'); } setShowRestartConfirm(false); }} className="py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest transition-all">Sì, Riavvia</button>
                         <button onClick={() => setShowRestartConfirm(false)} className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest text-slate-400 transition-all">Annulla</button>
                      </div>
                   </div>
                </div>
             )}

             {matchState.phase === 'MATCH_END' && (
                 <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 z-[150]">
                    <h2 className="text-4xl font-cinzel text-amber-500 font-bold mb-4 text-center tracking-widest">FINE MANO</h2>
                    <div className="text-2xl text-white mb-10 text-center">{message}</div>
                    {(gameMode === 'OFFLINE' || isHost) ? (
                       <button onClick={() => gameMode === 'ONLINE' ? startOnlineMatchAsHost() : startNewMatch('OFFLINE')} className="w-full max-w-xs py-5 bg-amber-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-500 transition-all border-b-4 border-amber-800 active:translate-y-1">Prossima Mano</button>
                    ) : (
                       <div className="text-white/50 text-sm animate-pulse">In attesa dell'Host...</div>
                    )}
                    <button onClick={() => setView('menu')} className="mt-6 text-white/60 uppercase font-bold hover:text-white transition-colors">Menu Iniziale</button>
                 </div>
             )}
         </div>
      )}
    </div>
  );
};

export default App;
