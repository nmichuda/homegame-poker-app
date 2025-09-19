const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const PokerGame = require('./poker/game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:3003"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const games = new Map();
const playerSockets = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('create-room', ({ playerName }) => {
    console.log(`Creating room for player: ${playerName} (${socket.id})`);
    const roomCode = generateRoomCode();
    const game = new PokerGame(roomCode);
    games.set(roomCode, game);

    const result = game.addPlayerToLobby(socket.id, playerName);
    if (result.success) {
      socket.join(roomCode);
      playerSockets.set(socket.id, { roomCode, playerName });

      console.log(`Room created: ${roomCode} for player: ${playerName}`);
      socket.emit('room-created', {
        roomCode,
        gameState: game.getLobbyState()
      });

      socket.to(roomCode).emit('player-joined', {
        playerName,
        gameState: game.getLobbyState()
      });
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('join-room', ({ roomCode, playerName }) => {
    const game = games.get(roomCode);
    if (!game) {
      socket.emit('error', 'Room not found');
      return;
    }

    const result = game.addPlayerToLobby(socket.id, playerName);
    if (result.success) {
      socket.join(roomCode);
      playerSockets.set(socket.id, { roomCode, playerName });

      socket.emit('room-joined', {
        roomCode,
        gameState: game.getLobbyState()
      });

      socket.to(roomCode).emit('player-joined', {
        playerName,
        gameState: game.getLobbyState()
      });
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('select-seat', ({ seatIndex }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.roomCode);
    if (!game) return;

    const result = game.selectSeat(socket.id, seatIndex);
    if (result.success) {
      // Broadcast updated lobby state to all players
      io.to(playerInfo.roomCode).emit('seat-selected', {
        playerName: playerInfo.playerName,
        seatIndex,
        gameState: game.getLobbyState()
      });
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('start-game', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.roomCode);
    if (!game) return;

    const result = game.startGame(socket.id);
    if (result.success) {
      // Set up timer callback
      game.onTimerExpired = (playerId) => {
        // Send updated game state to all players when timer expires
        game.players.forEach(player => {
          io.to(player.id).emit('game-updated', {
            gameState: game.getPlayerState(player.id)
          });
        });

        // Handle game flow after auto-action
        if (game.isRoundComplete()) {
          game.checkAllInScenario();

          setTimeout(() => {
            game.nextPhase();
            game.players.forEach(player => {
              io.to(player.id).emit('game-updated', {
                gameState: game.getPlayerState(player.id)
              });
            });
          }, 1000);
        } else {
          game.setNextPlayer();
        }
      };

      // Send individual game states to each player with their cards
      game.players.forEach(player => {
        io.to(player.id).emit('game-started', {
          gameState: game.getPlayerState(player.id)
        });
      });
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('player-action', ({ action, amount }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.roomCode);
    if (!game) return;

    console.log(`Player ${playerInfo.playerName} (${socket.id}) action: ${action} ${amount ? `amount: ${amount}` : ''}`);

    let result;
    switch (action) {
      case 'fold':
        result = game.fold(socket.id);
        break;
      case 'call':
        result = game.call(socket.id);
        break;
      case 'raise':
        result = game.raise(socket.id, amount);
        break;
      case 'check':
        result = game.check(socket.id);
        break;
      case 'show-cards':
        result = game.showCards(socket.id);
        break;
      default:
        return;
    }

    if (result.success) {
      // Send updated game state to all players
      game.players.forEach(player => {
        io.to(player.id).emit('game-updated', {
          gameState: game.getPlayerState(player.id)
        });
      });

      // Handle different phases
      if (game.phase === 'hand-ended') {
        // Hand has ended, set up timer for next hand
        const handleNextHand = () => {
          if (games.get(playerInfo.roomCode)) {
            game.startNextHand();
            game.players.forEach(player => {
              io.to(player.id).emit('game-updated', {
                gameState: game.getPlayerState(player.id)
              });
            });
          }
        };
        game.nextHandCallback = handleNextHand;
      } else {
        // Normal game flow
        if (game.isRoundComplete()) {
          // Check for all-in scenario only when round is complete
          game.checkAllInScenario();

          setTimeout(() => {
            game.nextPhase();
            game.players.forEach(player => {
              io.to(player.id).emit('game-updated', {
                gameState: game.getPlayerState(player.id)
              });
            });
          }, 1000);
        } else {
          game.setNextPlayer();
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.roomCode);
      if (game) {
        game.removePlayer(socket.id);

        socket.to(playerInfo.roomCode).emit('player-left', {
          playerName: playerInfo.playerName,
          gameState: game.getGameState()
        });

        if (game.players.length === 0) {
          games.delete(playerInfo.roomCode);
        }
      }

      playerSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});