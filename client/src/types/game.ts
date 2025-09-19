export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  currentBet: number;
  folded: boolean;
  allIn: boolean;
  hasActed: boolean;
  cards?: number;
  showingCards?: boolean;
  visibleCards?: Card[];
  seatIndex?: number;
  position?: string;
}

export interface Seat {
  seatIndex: number;
  player: Player | null;
}

export interface LobbyPlayer {
  id: string;
  name: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  seats?: Seat[];
  lobbyPlayers?: LobbyPlayer[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayerIndex: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'hand-ended';
  dealerIndex: number;
  playerCards?: Card[];
  winner?: { id: string; name: string } | null;
  creatorId?: string;
  handTimeRemaining?: number;
}

export interface PlayerAction {
  type: 'fold' | 'call' | 'raise' | 'check';
  amount?: number;
}