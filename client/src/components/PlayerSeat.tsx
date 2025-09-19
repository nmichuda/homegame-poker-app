import React from 'react';
import { Player } from '../types/game';
import Card from './Card';

interface PlayerSeatProps {
  player: Player;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  playerCards?: any[];
  showCards?: boolean;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentPlayer,
  isDealer,
  playerCards = [],
  showCards = false
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Player cards */}
      <div className="flex gap-1 mb-2">
        {player.visibleCards && player.visibleCards.length > 0 ? (
          // Show actual cards if player is showing them
          player.visibleCards.map((card, index) => (
            <Card key={index} card={card} className="scale-75 shadow-md" />
          ))
        ) : !player.folded && player.cards && player.cards > 0 ? (
          // Show card backs for active players
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} card={{} as any} faceDown className="scale-75 shadow-md" />
          ))
        ) : (
          // Empty space for folded players
          <div className="w-12 h-18 opacity-0" />
        )}
      </div>

      {/* Position label above everything */}
      {player.position && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded font-bold shadow-md z-20">
          {player.position}
        </div>
      )}

      {/* Player name card */}
      <div className={`
        relative px-3 py-2 rounded-lg shadow-lg min-w-20 text-center
        ${isCurrentPlayer
          ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-black border-2 border-yellow-600'
          : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-800 border-2 border-slate-400'
        }
        ${player.folded ? 'opacity-60' : ''}
        ${player.currentBet > 0 ? 'mb-6' : ''} // Add margin bottom when there's a bet
      `}>
        {/* Dealer button */}
        {isDealer && (
          <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold border-2 border-white shadow-md z-10">
            D
          </div>
        )}

        {/* Player name */}
        <h3 className="font-bold text-sm leading-tight">{player.name}</h3>

        {/* Chips */}
        <div className="text-xs opacity-80">
          ${player.chips}
        </div>

        {/* Status indicators */}
        {player.allIn && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">
            ALL IN
          </div>
        )}

        {player.folded && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white px-2 py-0.5 rounded text-xs font-bold">
            FOLD
          </div>
        )}

        {player.showingCards && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">
            SHOW
          </div>
        )}
      </div>

      {/* Current bet chip stack - positioned below name card */}
      {player.currentBet > 0 && (
        <div className="mt-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md border border-green-800">
          Bet: ${player.currentBet}
        </div>
      )}
    </div>
  );
};

export default PlayerSeat;