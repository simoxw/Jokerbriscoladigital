
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
import OnlineMenu from './components/OnlineMenu';
import Rules from './components/Rules';
import MainMenu from './components/MainMenu';
import IAIndicator from './components/IAIndicator';
import GameDialogs from './components/GameDialogs';
import ItalianCard from './components/ItalianCard';
import { preloadAllCards } from './cardPreloader';
import { audioManager } from './utils/audio';

// Configurazione Socket.IO
const socket: Socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['polling', 'websocket'],
  timeout: 10000
});


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
  useEffect(() => {
    preloadAllCards().then(() => {
      console.log("🃏 Carte precaricate con successo!");
    });
  }, []);
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

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('joker_is_muted') === 'true';
  });

  useEffect(() => {
    audioManager.setMuted(isMuted);
    localStorage.setItem('joker_is_muted', isMuted.toString());
  }, [isMuted]);

  // Player name persistence
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('joker_player_name') || "";
  });

  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [connectedPlayers, setConnectedPlayers] = useState<{ name: string, index: number }[]>([]);
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
        audioManager.play('CARD_PLAY');
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
    const nameToUse = playerName.trim() || "Host";

    // Save to localStorage
    if (playerName.trim()) localStorage.setItem('joker_player_name', playerName.trim());

    setIsConnecting(true);
    if (!socket.connected) socket.connect();

    myPlayerNameRef.current = nameToUse;
    socket.emit('create_room', nameToUse);
    setTimeout(() => setIsConnecting(false), 5000);
  };

  const joinOnlineRoom = () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (cleanCode.length !== 4) {
      alert("Il codice deve essere di 4 caratteri");
      return;
    }

    const nameToUse = playerName.trim() || `Ospite_${Math.floor(Math.random() * 100)}`;

    // Save to localStorage
    if (playerName.trim()) localStorage.setItem('joker_player_name', playerName.trim());

    setIsConnecting(true);
    if (!socket.connected) socket.connect();

    myPlayerNameRef.current = nameToUse;

    // Reset previous room state just in case
    setRoomCode("");
    setConnectedPlayers([]);

    socket.emit('join_room', { code: cleanCode, name: nameToUse });
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

      // Suono di pesca carte (solo se la partita non è finita)
      if (!isGameOver) {
        setTimeout(() => audioManager.play('CARD_DRAW'), 500);
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

    // Suono carta giocata localmente
    audioManager.play('CARD_PLAY');
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

        // Suono carta IA
        audioManager.play('CARD_PLAY');
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
        <MainMenu
          startNewMatch={startNewMatch}
          goToOnlineMenu={goToOnlineMenu}
          setView={setView}
        />
      )}

      {view === 'online_menu' && (
        <OnlineMenu
          isConnected={isConnected}
          roomCode={roomCode}
          playerName={playerName}
          setPlayerName={setPlayerName}
          connectedPlayers={connectedPlayers}
          myOnlineIndex={myOnlineIndex}
          isHost={isHost}
          isConnecting={isConnecting}
          inputCode={inputCode}
          setInputCode={setInputCode}
          createOnlineRoom={createOnlineRoom}
          joinOnlineRoom={joinOnlineRoom}
          startOnlineMatchAsHost={startOnlineMatchAsHost}
          copyCodeToClipboard={copyCodeToClipboard}
          setView={setView}
          setRoomCode={setRoomCode}
          setConnectedPlayers={setConnectedPlayers}
          socket={socket}
        />
      )}

      {view === 'rules' && (
        <Rules setView={setView} />
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
                <button onClick={() => setIsMuted(prev => !prev)} className={`w-9 h-9 ${isMuted ? 'bg-slate-600' : 'bg-green-600'} rounded-xl flex items-center justify-center shadow-lg border ${isMuted ? 'border-slate-400' : 'border-green-400'} text-white transition-colors`} title={isMuted ? "Attiva Audio" : "Muta"}>
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <button onClick={() => setShowHistory(true)} className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-amber-400 text-white" title="Cronologia">📊</button>
                <button onClick={() => setShowDifficulty(true)} className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-amber-400 text-white" title="IA">⚙️</button>
                <button onClick={() => setShowRestartConfirm(true)} className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg border border-blue-400 text-white transition-colors" title="Riavvia">🔄</button>
                <button onClick={() => { setView('menu'); if (gameMode === 'ONLINE') socket.emit('disconnect_game'); }} className="w-9 h-9 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center shadow-lg border border-red-400 text-white font-bold" title="Esci">ESC</button>
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
          </div>

          {showHistory && <HistoryPanel history={matchState.history} onClose={() => setShowHistory(false)} />}
          {showDifficulty && <DifficultyPanel current={difficulty} onSelect={(d) => { setDifficulty(d); setShowDifficulty(false); }} onClose={() => setShowDifficulty(false)} />}

          <GameDialogs
            matchState={matchState}
            gameMode={gameMode}
            isHost={isHost}
            message={message}
            showRestartConfirm={showRestartConfirm}
            setShowRestartConfirm={setShowRestartConfirm}
            startNewMatch={startNewMatch}
            startOnlineMatchAsHost={startOnlineMatchAsHost}
            completeTrick={completeTrick}
            setView={setView}
            socket={socket}
          />
        </div>
      )}
    </div>
  );
};

export default App;
