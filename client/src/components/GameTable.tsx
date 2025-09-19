import React, { useState, useEffect } from 'react';
import { GameState } from '../types/game';
import Card from './Card';
import PlayerSeat from './PlayerSeat';

interface GameTableProps {
  gameState: GameState;
  currentPlayerId: string;
  onAction: (action: string, amount?: number) => void;
  onSelectSeat: (seatIndex: number) => void;
}

const GameTable: React.FC<GameTableProps> = ({ gameState, currentPlayerId, onAction, onSelectSeat }) => {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
  const canCheck = currentPlayer?.currentBet === gameState.currentBet;
  const callAmount = gameState.currentBet - (currentPlayer?.currentBet || 0);

  // Timer effect
  useEffect(() => {
    if (gameState.handTimeRemaining && isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'hand-ended') {
      setTimeRemaining(Math.ceil(gameState.handTimeRemaining / 1000));

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.handTimeRemaining, isMyTurn, gameState.phase]);

  // Reset timer when it's not the player's turn
  useEffect(() => {
    if (!isMyTurn) {
      setTimeRemaining(30);
    }
  }, [isMyTurn]);

  // Calculate betting amounts
  const minBet = gameState.currentBet === 0 ? 10 : gameState.currentBet * 2; // Big blind or double current bet
  const halfPot = Math.floor(gameState.pot / 2);
  const threeFourthsPot = Math.floor(gameState.pot * 0.75);
  const potBet = gameState.pot;

  const handleRaise = () => {
    if (raiseAmount > 0) {
      onAction('raise', raiseAmount);
      setRaiseAmount(0);
    }
  };

  const handlePresetBet = (amount: number) => {
    const maxBet = currentPlayer?.chips || 0;
    const actualBet = Math.min(amount, maxBet);
    setRaiseAmount(actualBet);
  };

  const handleAllIn = () => {
    const allInAmount = currentPlayer?.chips || 0;
    onAction('raise', allInAmount);
  };

  const getSeatPosition = (seatIndex: number) => {
    // Fixed positions for 9 seats around the table
    const positions = [
      { top: '5%', left: '50%', transform: 'translateX(-50%)' }, // Seat 0: top center
      { top: '15%', right: '8%' }, // Seat 1: top right
      { top: '40%', right: '3%', transform: 'translateY(-50%)' }, // Seat 2: middle right
      { bottom: '30%', right: '15%' }, // Seat 3: bottom right
      { bottom: '30%', right: '40%' }, // Seat 4: bottom center-right
      { bottom: '30%', left: '40%' }, // Seat 5: bottom center-left
      { bottom: '30%', left: '15%' }, // Seat 6: bottom left
      { top: '40%', left: '3%', transform: 'translateY(-50%)' }, // Seat 7: middle left
      { top: '15%', left: '8%' } // Seat 8: top left
    ];

    return positions[seatIndex] || { top: '50%', left: '50%' };
  };

  return (
    <div className="relative bg-slate-700 min-h-screen p-4">
      {/* Large poker table ellipse */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-green-700 to-green-800 rounded-full shadow-2xl border-8 border-amber-600">
        {/* Table felt texture */}
        <div className="absolute inset-4 bg-green-600 rounded-full shadow-inner">
          {/* Center playing area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4">
              <h2 className="text-2xl font-bold mb-2 text-yellow-200">POT: ${gameState.pot}</h2>
              <p className="text-lg text-white">Phase: {gameState.phase.toUpperCase()}</p>
              {gameState.currentBet > 0 && (
                <p className="text-sm text-yellow-100">Current bet: ${gameState.currentBet}</p>
              )}
              {isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'hand-ended' && (
                <div className="mt-2">
                  <div className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-red-300' : 'text-green-300'}`}>
                    Time: {timeRemaining}s
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        timeRemaining <= 10 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Community cards */}
            <div className="flex justify-center gap-3">
              {gameState.communityCards.map((card, index) => (
                <Card key={index} card={card} className="shadow-lg" />
              ))}
              {/* Placeholder cards for future community cards */}
              {Array.from({ length: 5 - gameState.communityCards.length }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="w-16 h-24 border-2 border-dashed border-gray-400 border-opacity-50 rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seats positioned around the table */}
      {gameState.seats?.map((seat, seatIndex) => {
        if (!seat.player || seat.player.id === currentPlayerId) return null; // Don't show current player here

        const position = getSeatPosition(seatIndex);
        const playerIndex = gameState.players.findIndex(p => p.id === seat.player?.id);

        return (
          <div
            key={`seat-${seatIndex}`}
            className="absolute z-10"
            style={position}
          >
            <PlayerSeat
              player={seat.player}
              isCurrentPlayer={playerIndex === gameState.currentPlayerIndex}
              isDealer={playerIndex === gameState.dealerIndex}
              playerCards={[]}
              showCards={false}
            />
          </div>
        );
      })}

      {/* Empty seats with plus buttons */}
      {gameState.seats?.map((seat, seatIndex) => {
        if (seat.player) return null;

        const position = getSeatPosition(seatIndex);
        const currentPlayerInLobby = gameState.lobbyPlayers?.some(p => p.id === currentPlayerId);
        const canSelectSeat = currentPlayerInLobby && gameState.phase === 'waiting';

        return (
          <div
            key={`empty-seat-${seatIndex}`}
            className="absolute z-10"
            style={position}
          >
            {canSelectSeat ? (
              <button
                onClick={() => onSelectSeat(seatIndex)}
                className="bg-green-400 hover:bg-green-500 border-2 border-green-600 rounded-full w-16 h-16 flex items-center justify-center transition-colors shadow-lg transform hover:scale-110"
                title={`Select seat ${seatIndex + 1}`}
              >
                <span className="text-white text-2xl font-bold">+</span>
              </button>
            ) : (
              <div className="bg-gray-400 bg-opacity-50 border-2 border-dashed border-gray-500 rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-gray-600 text-xs font-bold">{seatIndex + 1}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Current player area at bottom */}
      {currentPlayer && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-slate-100 to-slate-200 p-3 rounded-lg shadow-xl border-2 border-slate-400 max-w-md w-full mx-4">
          {/* Player cards */}
          {gameState.playerCards && (
            <div className="flex gap-2 justify-center mb-3">
              {gameState.playerCards.map((card, index) => (
                <Card key={index} card={card} className="shadow-lg scale-90" />
              ))}
            </div>
          )}

          {/* Player info */}
          <div className="text-center mb-3">
            <h3 className="text-lg font-bold text-slate-800">{currentPlayer.name}</h3>
            <div className="flex justify-center gap-4 text-sm text-slate-600">
              <span>Chips: ${currentPlayer.chips}</span>
              {currentPlayer.currentBet > 0 && (
                <span className="text-green-700 font-semibold">Bet: ${currentPlayer.currentBet}</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {isMyTurn && !currentPlayer.folded && gameState.phase !== 'waiting' && gameState.phase !== 'hand-ended' && (
            <div className="space-y-3">
              {/* Primary actions */}
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => onAction('fold')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-colors"
                >
                  Fold
                </button>

                {canCheck ? (
                  <button
                    onClick={() => onAction('check')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-colors"
                  >
                    Check
                  </button>
                ) : (
                  <button
                    onClick={() => onAction('call')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-colors"
                    disabled={callAmount === 0}
                  >
                    Call ${callAmount}
                  </button>
                )}
              </div>

              {/* Preset betting buttons */}
              <div className="flex gap-1 justify-center flex-wrap text-xs">
                <button
                  onClick={() => handlePresetBet(minBet)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                  disabled={minBet > (currentPlayer?.chips || 0)}
                >
                  Min (${minBet})
                </button>

                {gameState.pot > 0 && (
                  <>
                    <button
                      onClick={() => handlePresetBet(halfPot)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                      disabled={halfPot > (currentPlayer?.chips || 0)}
                    >
                      1/2 Pot (${halfPot})
                    </button>

                    <button
                      onClick={() => handlePresetBet(threeFourthsPot)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                      disabled={threeFourthsPot > (currentPlayer?.chips || 0)}
                    >
                      3/4 Pot (${threeFourthsPot})
                    </button>

                    <button
                      onClick={() => handlePresetBet(potBet)}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                      disabled={potBet > (currentPlayer?.chips || 0)}
                    >
                      Pot (${potBet})
                    </button>
                  </>
                )}

                <button
                  onClick={handleAllIn}
                  className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
                >
                  All-In
                </button>
              </div>

              {/* Custom amount */}
              <div className="flex items-center gap-2 justify-center">
                <input
                  type="number"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={currentPlayer.chips}
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded text-center font-semibold text-sm"
                  placeholder="Custom"
                />
                <button
                  onClick={handleRaise}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded font-semibold shadow-sm transition-colors text-sm"
                  disabled={raiseAmount <= 0}
                >
                  Bet ${raiseAmount}
                </button>
              </div>
            </div>
          )}

          {/* Turn indicator */}
          {!isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'hand-ended' && (
            <div className="text-center text-slate-600 font-medium">
              Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}'s action...
            </div>
          )}
        </div>
      )}

      {/* Lobby players list */}
      {gameState.phase === 'waiting' && gameState.lobbyPlayers && gameState.lobbyPlayers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-50">
          <h3 className="font-bold text-lg mb-2">Players in Lobby:</h3>
          <ul className="space-y-1">
            {gameState.lobbyPlayers.map(player => (
              <li key={player.id} className="text-sm text-gray-700">
                {player.name} {player.id === currentPlayerId && '(You)'}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">Click + buttons to select a seat</p>
        </div>
      )}

      {/* Center overlay messages */}
      {gameState.phase === 'waiting' && gameState.players.length >= 2 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-40">
          {gameState.creatorId === currentPlayerId ? (
            <button
              onClick={() => onAction('start')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg text-xl font-bold shadow-lg"
            >
              Start Game
            </button>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-600">Waiting for room creator to start the game...</p>
            </div>
          )}
        </div>
      )}

      {gameState.phase === 'waiting' && gameState.players.length < 2 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-40 bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-gray-600">Need at least 2 seated players to start the game</p>
          <p className="text-sm text-gray-500 mt-2">Players seated: {gameState.players.length}/9</p>
        </div>
      )}

      {gameState.phase === 'hand-ended' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-40 bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">
            🎉 {gameState.winner?.name} Wins!
          </h2>
          <p className="text-gray-600 mb-4">Next hand starts in a few seconds...</p>

          {currentPlayer && !currentPlayer.folded && !currentPlayer.showingCards && (
            <button
              onClick={() => onAction('show-cards')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Show My Cards
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GameTable;