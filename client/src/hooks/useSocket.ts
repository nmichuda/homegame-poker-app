import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types/game';

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io(serverUrl);

    socketInstance.on('connect', () => {
      setConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('room-created', (data) => {
      setRoomCode(data.roomCode);
      setGameState(data.gameState);
      setError(null);
    });

    socketInstance.on('room-joined', (data) => {
      setRoomCode(data.roomCode);
      setGameState(data.gameState);
      setError(null);
    });

    socketInstance.on('game-started', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('cards-dealt', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('game-updated', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('phase-changed', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('action-taken', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('player-joined', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('player-left', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('seat-selected', (data) => {
      setGameState(data.gameState);
    });

    socketInstance.on('error', (errorMessage) => {
      setError(errorMessage);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  const createRoom = (playerName: string) => {
    if (socket) {
      socket.emit('create-room', { playerName });
    }
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    if (socket) {
      socket.emit('join-room', { roomCode, playerName });
    }
  };

  const selectSeat = (seatIndex: number) => {
    if (socket) {
      socket.emit('select-seat', { seatIndex });
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const makeAction = (action: string, amount?: number) => {
    if (socket) {
      socket.emit('player-action', { action, amount });
    }
  };

  return {
    connected,
    gameState,
    roomCode,
    error,
    socketId: socket?.id,
    createRoom,
    joinRoom,
    selectSeat,
    startGame,
    makeAction
  };
};