
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configurazione CORS
const io = new Server(server, {
  cors: {
    origin: [
      "https://simoxw.github.io",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Store rooms: { [roomCode]: { players: [], state: null, host: string } }
let rooms = {};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Crea Stanza
  socket.on('create_room', (playerName) => {
    let roomCode;
    let attempts = 0;

    // Ensure uniqueness
    do {
      roomCode = generateRoomCode();
      attempts++;
    } while (rooms[roomCode] && attempts < 10);

    rooms[roomCode] = {
      players: [{ id: socket.id, name: playerName, index: 0 }],
      host: socket.id,
      state: null
    };

    socket.join(roomCode);

    console.log(`[SERVER] Room Created: ${roomCode} by ${playerName} (${socket.id})`);

    // Emit Success to Creator
    socket.emit('room_created', { code: roomCode, myIndex: 0 });

    // Broadcast list update immediately
    io.to(roomCode).emit('update_players', rooms[roomCode].players);
  });

  // 2. Entra Stanza
  socket.on('join_room', ({ code, name }) => {
    // Sanitize input
    const safeCode = code ? code.trim().toUpperCase() : '';
    console.log(`[SERVER] Join Request: ${name} wants to join '${safeCode}'`);

    const room = rooms[safeCode];

    if (!room) {
      console.log(`[SERVER] Room '${safeCode}' not found.`);
      socket.emit('error_message', `Stanza ${safeCode} non trovata. Controlla il codice.`);
      return;
    }

    if (room.players.length >= 3) {
      socket.emit('error_message', 'La stanza è piena (Max 3 giocatori).');
      return;
    }

    // NUOVO: Impedisci di unirsi se la partita è già iniziata
    if (room.state && room.state.phase === 'PLAYING') {
      console.log(`[SERVER] ${name} cannot join ${safeCode} - game already started`);
      socket.emit('error_message', 'La partita è già iniziata. Non è possibile unirsi.');
      return;
    }

    // Add player to room
    const newIndex = room.players.length;
    const newPlayer = { id: socket.id, name: name, index: newIndex };

    room.players.push(newPlayer);
    socket.join(safeCode);

    console.log(`[SERVER] ${name} joined ${safeCode} successfully. Players in room:`, room.players.map(p => p.name));

    // 1. Tell the joiner they successfully joined with their index and current game state
    socket.emit('room_joined', {
      code: safeCode,
      myIndex: newIndex,
      players: room.players,
      gameState: room.state // Send current game state if game already started
    });

    // 2. Broadcast to ALL players in room (including the new joiner) the updated player list
    io.to(safeCode).emit('update_players', room.players);

    console.log(`[SERVER] Emitted room_joined to ${name}, emitted update_players to room ${safeCode}`);
  });

  // 3. Inizia Partita (Solo Host)
  socket.on('start_game', ({ code, initialGameState }) => {
    if (rooms[code] && rooms[code].host === socket.id) {
      rooms[code].state = initialGameState;
      console.log(`[SERVER] Game starting in room ${code}, players:`, rooms[code].players.length);
      console.log(`[SERVER] Broadcasting game_started to all players in room ${code}`);
      io.to(code).emit('game_started', initialGameState);
      console.log(`[SERVER] game_started sent successfully`);
    } else {
      console.log(`[SERVER] ERROR: Cannot start game - room ${code} not found or socket is not host`);
    }
  });

  // 4. Gioca Carta
  socket.on('play_card', ({ code, card, playerId }) => {
    console.log(`[SERVER] Player ${playerId} played card in room ${code}`);
    socket.to(code).emit('remote_play', { card, playerId });
  });

  // 4b. Gioca Carta IA (sincronizza tutto lo stato)
  socket.on('ai_play_card', ({ code, card, playerId, gameState }) => {
    console.log(`[SERVER] AI ${playerId} played card in room ${code}`);
    if (rooms[code]) {
      rooms[code].state = gameState;
      console.log(`[SERVER] Broadcasting ai_remote_play to all players in room ${code}`);
      // IMPORTANTE: io.to(code) invia a TUTTI nella stanza, incluso il mittente
      io.to(code).emit('ai_remote_play', { card, playerId, gameState });
      console.log(`[SERVER] ai_remote_play sent successfully`);
    }
  });

  // 5. Aggiornamento Stato Partita
  socket.on('update_game_state', ({ code, state }) => {
    if (rooms[code]) {
      rooms[code].state = state;
      console.log(`[SERVER] Game state updated in room ${code}, players in room:`, rooms[code].players.length);
      console.log(`[SERVER] Broadcasting sync_game_state to all players in room ${code}`);
      io.to(code).emit('sync_game_state', state);
      console.log(`[SERVER] sync_game_state sent successfully`);
    } else {
      console.log(`[SERVER] ERROR: Room ${code} not found when trying to update game state`);
    }
  });

  // 6. Disconnessione Gioco
  socket.on('disconnect_game', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });
});

function handleDisconnect(socket) {
  for (const code in rooms) {
    const room = rooms[code];
    const wasPlayer = room.players.find(p => p.id === socket.id);

    if (wasPlayer) {
      room.players = room.players.filter(p => p.id !== socket.id);
      socket.leave(code);
      console.log(`[SERVER] User left room ${code}. Remaining: ${room.players.length}`);

      if (room.players.length === 0) {
        delete rooms[code];
        console.log(`[SERVER] Room ${code} deleted (empty)`);
      } else {
        if (room.host === socket.id) {
          // If host leaves, next player becomes host
          room.host = room.players[0].id;
        }
        io.to(code).emit('update_players', room.players);
      }
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Socket.IO running on port ${PORT}`);
});
