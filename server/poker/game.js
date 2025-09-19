const Deck = require('./deck');
const HandEvaluator = require('./handEvaluator');

class PokerGame {
  constructor(roomId, maxPlayers = 9) {
    this.roomId = roomId;
    this.maxPlayers = maxPlayers;
    this.seats = Array(maxPlayers).fill(null); // Fixed seats array
    this.players = [];
    this.lobbyPlayers = []; // Players in lobby who haven't selected seats yet
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayerIndex = 0;
    this.dealerIndex = 0;
    this.phase = 'waiting'; // waiting, preflop, flop, turn, river, showdown, hand-ended
    this.smallBlind = 5;
    this.bigBlind = 10;
    this.winner = null;
    this.showCardsTimer = null;
    this.playersShowingCards = new Set();
    this.creatorId = null;
    this.handTimer = null;
    this.handTimeLimit = 30000; // 30 seconds per action
  }

  addPlayer(playerId, playerName, seatIndex = null) {
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (this.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Player already in game' };
    }

    // If no seat specified, find first available seat
    if (seatIndex === null) {
      seatIndex = this.seats.findIndex(seat => seat === null);
      if (seatIndex === -1) {
        return { success: false, error: 'No available seats' };
      }
    } else {
      // Check if requested seat is available
      if (seatIndex < 0 || seatIndex >= this.maxPlayers || this.seats[seatIndex] !== null) {
        return { success: false, error: 'Seat not available' };
      }
    }

    const player = {
      id: playerId,
      name: playerName,
      chips: 1000,
      cards: [],
      currentBet: 0,
      folded: false,
      allIn: false,
      hasActed: false,
      seatIndex: seatIndex
    };

    // Set the first player as the creator
    if (this.players.length === 0) {
      this.creatorId = playerId;
    }

    this.seats[seatIndex] = player;
    this.players.push(player);
    return { success: true, player, seatIndex };
  }

  addPlayerToLobby(playerId, playerName) {
    if (this.lobbyPlayers.length + this.players.length >= this.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (this.lobbyPlayers.some(p => p.id === playerId) || this.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Player already in game' };
    }

    const lobbyPlayer = {
      id: playerId,
      name: playerName
    };

    // Set the first player as the creator
    if (this.lobbyPlayers.length === 0 && this.players.length === 0) {
      this.creatorId = playerId;
    }

    this.lobbyPlayers.push(lobbyPlayer);
    return { success: true, player: lobbyPlayer };
  }

  selectSeat(playerId, seatIndex) {
    // Find player in lobby
    const lobbyPlayerIndex = this.lobbyPlayers.findIndex(p => p.id === playerId);
    if (lobbyPlayerIndex === -1) {
      return { success: false, error: 'Player not in lobby' };
    }

    // Check if seat is available
    if (seatIndex < 0 || seatIndex >= this.maxPlayers || this.seats[seatIndex] !== null) {
      return { success: false, error: 'Seat not available' };
    }

    const lobbyPlayer = this.lobbyPlayers[lobbyPlayerIndex];

    // Create seated player
    const player = {
      id: lobbyPlayer.id,
      name: lobbyPlayer.name,
      chips: 1000,
      cards: [],
      currentBet: 0,
      folded: false,
      allIn: false,
      hasActed: false,
      seatIndex: seatIndex
    };

    // Move from lobby to seated players
    this.lobbyPlayers.splice(lobbyPlayerIndex, 1);
    this.seats[seatIndex] = player;
    this.players.push(player);

    return { success: true, player, seatIndex };
  }

  removePlayer(playerId) {
    // Remove from lobby first
    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== playerId);

    // Remove from seated players
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      this.seats[player.seatIndex] = null;
    }
    this.players = this.players.filter(p => p.id !== playerId);

    if (this.players.length < 2 && this.phase !== 'waiting') {
      this.endGame();
    }
  }

  startGame(requesterId) {
    if (this.players.length < 2) {
      return { success: false, error: 'Need at least 2 players' };
    }

    if (requesterId !== this.creatorId) {
      return { success: false, error: 'Only the room creator can start the game' };
    }

    this.phase = 'preflop';
    this.dealerIndex = 0;
    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = this.bigBlind;

    this.players.forEach(player => {
      player.cards = [];
      player.currentBet = 0;
      player.folded = false;
      player.allIn = false;
      player.hasActed = false;
    });

    this.dealHoleCards();
    this.postBlinds();
    this.startHandTimer();

    return { success: true };
  }

  dealHoleCards() {
    for (let i = 0; i < 2; i++) {
      this.players.forEach(player => {
        if (!player.folded) {
          player.cards.push(this.deck.dealCard());
        }
      });
    }
  }

  postBlinds() {
    const smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
    const bigBlindIndex = (this.dealerIndex + 2) % this.players.length;

    // Post blinds but don't mark them as having acted
    const smallBlindPlayer = this.players[smallBlindIndex];
    const bigBlindPlayer = this.players[bigBlindIndex];

    // Small blind
    smallBlindPlayer.chips -= this.smallBlind;
    smallBlindPlayer.currentBet = this.smallBlind;
    this.pot += this.smallBlind;

    // Big blind
    bigBlindPlayer.chips -= this.bigBlind;
    bigBlindPlayer.currentBet = this.bigBlind;
    this.pot += this.bigBlind;
    this.currentBet = this.bigBlind;

    // Don't mark blind players as having acted - they need a chance to act in preflop
    smallBlindPlayer.hasActed = false;
    bigBlindPlayer.hasActed = false;

    // Set current player to the one after big blind (or back to small blind in heads-up)
    if (this.players.length === 2) {
      this.currentPlayerIndex = smallBlindIndex; // Small blind acts first in heads-up
    } else {
      this.currentPlayerIndex = (bigBlindIndex + 1) % this.players.length;
    }
  }

  setNextPlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;

    while (this.players[nextIndex].folded || this.players[nextIndex].allIn) {
      nextIndex = (nextIndex + 1) % this.players.length;
      if (nextIndex === this.currentPlayerIndex) break;
    }

    this.currentPlayerIndex = nextIndex;
    this.startHandTimer();
  }

  startHandTimer() {
    this.clearHandTimer();

    const currentPlayer = this.players[this.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.folded || currentPlayer.allIn) {
      return;
    }

    this.handTimer = setTimeout(() => {
      this.handleTimerExpired();
    }, this.handTimeLimit);
  }

  clearHandTimer() {
    if (this.handTimer) {
      clearTimeout(this.handTimer);
      this.handTimer = null;
    }
  }

  handleTimerExpired() {
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.folded || currentPlayer.allIn) {
      return;
    }

    // If there's a bet to call, automatically fold
    if (currentPlayer.currentBet < this.currentBet) {
      this.fold(currentPlayer.id);
    } else {
      // No bet to call, automatically check
      this.check(currentPlayer.id);
    }

    // Notify that timer expired (this will be handled by the server)
    if (this.onTimerExpired) {
      this.onTimerExpired(currentPlayer.id);
    }
  }

  placeBet(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) return { success: false };

    const actualBet = Math.min(amount, player.chips);
    player.chips -= actualBet;
    player.currentBet += actualBet;
    this.pot += actualBet;

    if (player.chips === 0) {
      player.allIn = true;
      console.log(`Player ${player.name} (${playerId}) is now all-in with ${player.currentBet}`);
    }

    if (player.currentBet > this.currentBet) {
      this.currentBet = player.currentBet;
    }

    player.hasActed = true;
    return { success: true };
  }

  fold(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    this.clearHandTimer();
    player.folded = true;
    player.hasActed = true;

    const activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      this.startHandEndedPhase(activePlayers[0]);
      return { success: true };
    }

    return { success: true };
  }

  call(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    this.clearHandTimer();
    const callAmount = this.currentBet - player.currentBet;
    return this.placeBet(playerId, callAmount);
  }

  raise(playerId, amount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    this.clearHandTimer();
    const totalBet = this.currentBet + amount;
    const betAmount = totalBet - player.currentBet;
    return this.placeBet(playerId, betAmount);
  }

  check(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.currentBet !== this.currentBet) {
      return { success: false };
    }

    this.clearHandTimer();
    player.hasActed = true;
    return { success: true };
  }

  isRoundComplete() {
    const activePlayers = this.players.filter(p => !p.folded && !p.allIn);

    // In preflop, all players (including blinds) need to have acted AND matched the current bet
    // OR there's been a raise and all players have had a chance to respond
    const allPlayersActed = activePlayers.every(p => p.hasActed);
    const allBetsMatched = activePlayers.every(p => p.currentBet === this.currentBet);
    const isComplete = allPlayersActed && allBetsMatched;

    console.log(`Round complete check: ${activePlayers.length} active players, all acted: ${allPlayersActed}, all bets matched: ${allBetsMatched}, round complete: ${isComplete}`);
    return isComplete;
  }

  checkAllInScenario() {
    const activePlayers = this.players.filter(p => !p.folded);
    const playersNotAllIn = activePlayers.filter(p => !p.allIn);

    // Only trigger if ALL remaining players are all-in (no one left to act)
    if (playersNotAllIn.length === 0 && activePlayers.length > 1) {
      // Show all hands
      activePlayers.forEach(player => {
        this.playersShowingCards.add(player.id);
      });

      // If we haven't dealt all community cards yet, deal them all
      while (this.communityCards.length < 5 && this.phase !== 'showdown') {
        switch (this.phase) {
          case 'preflop':
            this.phase = 'flop';
            this.dealCommunityCards(3);
            break;
          case 'flop':
            this.phase = 'turn';
            this.dealCommunityCards(1);
            break;
          case 'turn':
            this.phase = 'river';
            this.dealCommunityCards(1);
            break;
          case 'river':
            this.phase = 'showdown';
            this.showdown();
            return;
        }
      }

      // If all cards are dealt, go to showdown
      if (this.communityCards.length === 5 && this.phase !== 'showdown') {
        this.phase = 'showdown';
        this.showdown();
      }
    }
  }

  nextPhase() {
    this.clearHandTimer();
    this.players.forEach(p => {
      p.hasActed = false;
      p.currentBet = 0;
    });
    this.currentBet = 0;

    switch (this.phase) {
      case 'preflop':
        this.phase = 'flop';
        this.dealCommunityCards(3);
        break;
      case 'flop':
        this.phase = 'turn';
        this.dealCommunityCards(1);
        break;
      case 'turn':
        this.phase = 'river';
        this.dealCommunityCards(1);
        break;
      case 'river':
        this.phase = 'showdown';
        this.showdown();
        break;
    }

    // Check if all remaining players are all-in after dealing cards
    this.checkAllInScenario();

    // Start timer for the first player if we're not in showdown
    if (this.phase !== 'showdown') {
      this.startHandTimer();
    }
  }

  dealCommunityCards(count) {
    for (let i = 0; i < count; i++) {
      this.communityCards.push(this.deck.dealCard());
    }
  }

  showdown() {
    const activePlayers = this.players.filter(p => !p.folded);
    const hands = activePlayers.map(player => ({
      player,
      hand: HandEvaluator.evaluateHand([...player.cards, ...this.communityCards])
    }));

    hands.sort((a, b) => HandEvaluator.compareHands(b.hand, a.hand));

    const winner = hands[0].player;

    // Automatically show all hands at showdown
    activePlayers.forEach(player => {
      this.playersShowingCards.add(player.id);
    });

    this.startHandEndedPhase(winner);
  }

  startHandEndedPhase(winner) {
    this.clearHandTimer();
    this.phase = 'hand-ended';
    this.winner = winner;
    // Don't clear playersShowingCards here as they may have been set in showdown

    // Award pot to winner
    winner.chips += this.pot;
    this.pot = 0;

    // Start 5-second timer
    this.showCardsTimer = setTimeout(() => {
      if (this.nextHandCallback) {
        this.nextHandCallback();
      } else {
        this.startNextHand();
      }
    }, 5000);
  }

  showCards(playerId) {
    if (this.phase !== 'hand-ended') return { success: false };

    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded) return { success: false };

    this.playersShowingCards.add(playerId);
    return { success: true };
  }

  startNextHand() {
    if (this.showCardsTimer) {
      clearTimeout(this.showCardsTimer);
      this.showCardsTimer = null;
    }

    this.winner = null;
    this.playersShowingCards.clear();

    if (this.players.filter(p => p.chips > 0).length > 1) {
      this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
      this.startNewHand();
    } else {
      this.endGame();
    }
  }

  startNewHand() {
    this.phase = 'preflop';
    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = this.bigBlind;

    this.players.forEach(player => {
      player.cards = [];
      player.currentBet = 0;
      player.folded = false;
      player.allIn = false;
      player.hasActed = false;
    });

    this.dealHoleCards();
    this.postBlinds();
    this.startHandTimer();
  }

  endGame() {
    this.phase = 'waiting';
    this.players.forEach(player => {
      player.chips = 1000;
    });
  }

  getPositionLabel(seatIndex, dealerSeatIndex, totalPlayers) {
    // Temporarily disable position labels to fix server crash
    return '';
  }

  getLobbyState() {
    return {
      roomId: this.roomId,
      seats: this.seats.map((seat, index) => ({
        seatIndex: index,
        player: seat ? {
          id: seat.id,
          name: seat.name,
          chips: seat.chips,
          seatIndex: seat.seatIndex
        } : null
      })),
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        seatIndex: p.seatIndex
      })),
      lobbyPlayers: this.lobbyPlayers.map(p => ({
        id: p.id,
        name: p.name
      })),
      phase: this.phase,
      creatorId: this.creatorId,
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      communityCards: [],
      winner: null,
      handTimeRemaining: 0
    };
  }

  getGameState() {
    const dealerPlayer = this.players.find((_, index) => index === this.dealerIndex);
    const dealerSeatIndex = dealerPlayer ? dealerPlayer.seatIndex : 0;

    return {
      roomId: this.roomId,
      seats: this.seats.map((seat, index) => ({
        seatIndex: index,
        player: seat ? {
          id: seat.id,
          name: seat.name,
          chips: seat.chips,
          currentBet: seat.currentBet,
          folded: seat.folded,
          allIn: seat.allIn,
          hasActed: seat.hasActed,
          cards: seat.cards.length,
          showingCards: this.playersShowingCards.has(seat.id),
          seatIndex: seat.seatIndex,
          position: this.getPositionLabel(index, dealerSeatIndex, this.players.length)
        } : null
      })),
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        currentBet: p.currentBet,
        folded: p.folded,
        allIn: p.allIn,
        hasActed: p.hasActed,
        cards: p.cards.length,
        showingCards: this.playersShowingCards.has(p.id),
        seatIndex: p.seatIndex,
        position: this.getPositionLabel(p.seatIndex, dealerSeatIndex, this.players.length)
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      dealerIndex: this.dealerIndex,
      winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null,
      creatorId: this.creatorId,
      handTimeRemaining: this.handTimer ? this.handTimeLimit : 0
    };
  }

  getPlayerState(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const gameState = this.getGameState();

    // Add visible cards for players who are showing them
    if (this.phase === 'hand-ended') {
      gameState.players = gameState.players.map(p => {
        const playerObj = this.players.find(pl => pl.id === p.id);
        return {
          ...p,
          visibleCards: (p.showingCards || p.id === playerId) ? playerObj.cards : undefined
        };
      });
    }

    return {
      ...gameState,
      playerCards: player.cards
    };
  }
}

module.exports = PokerGame;