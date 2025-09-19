import React from 'react';
import { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, faceDown = false, className = '' }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  if (faceDown) {
    return (
      <div className={`w-16 h-24 bg-blue-600 border-2 border-blue-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white text-xs font-bold">🂠</div>
      </div>
    );
  }

  return (
    <div className={`w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 ${className}`}>
      <div className={`text-sm font-bold ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-2xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      <div className={`text-sm font-bold ${getSuitColor(card.suit)} transform rotate-180`}>
        {card.rank}
      </div>
    </div>
  );
};

export default Card;