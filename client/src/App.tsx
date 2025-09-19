import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import RoomLobby from './components/RoomLobby';
import GameTable from './components/GameTable';
import './App.css';

const SERVER_URL = 'http://localhost:3001';

function App() {
  const {
    connected,
    gameState,
    roomCode,
    error,
    socketId,
    createRoom,
    joinRoom,
    selectSeat,
    startGame,
    makeAction
  } = useSocket(SERVER_URL);

  const handleAction = (action: string, amount?: number) => {
    if (action === 'start') {
      startGame();
    } else {
      makeAction(action, amount);
    }
  };

  if (!connected) {
    return <RoomLobby onCreateRoom={() => {}} onJoinRoom={() => {}} error="Connecting..." connecting={true} />;
  }

  if (!gameState || !roomCode) {
    return (
      <RoomLobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
        connecting={false}
      />
    );
  }

  return (
    <div className="App">
      <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
        <h3 className="font-bold text-lg">Room Code: {roomCode}</h3>
        <p className="text-sm text-gray-600">Share this code with friends!</p>
        <p className="text-sm">Players: {gameState.players.length}/9</p>
      </div>

      {socketId && (
        <GameTable
          gameState={gameState}
          currentPlayerId={socketId}
          onAction={handleAction}
          onSelectSeat={selectSeat}
        />
      )}
    </div>
  );
}

export default App;