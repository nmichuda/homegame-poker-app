class HandEvaluator {
  static evaluateHand(cards) {
    if (cards.length < 5) {
      return { rank: 0, description: 'High Card', kickers: [] };
    }

    const sortedCards = [...cards].sort((a, b) => b.value - a.value);

    const isFlush = this.checkFlush(sortedCards);
    const isStraight = this.checkStraight(sortedCards);
    const groups = this.groupByRank(sortedCards);

    if (isFlush && isStraight) {
      if (sortedCards[0].value === 14 && sortedCards[1].value === 13) {
        return { rank: 9, description: 'Royal Flush', kickers: [] };
      }
      return { rank: 8, description: 'Straight Flush', kickers: [sortedCards[0].value] };
    }

    if (groups[0].length === 4) {
      return { rank: 7, description: 'Four of a Kind', kickers: [groups[0][0].value, groups[1][0].value] };
    }

    if (groups[0].length === 3 && groups[1].length === 2) {
      return { rank: 6, description: 'Full House', kickers: [groups[0][0].value, groups[1][0].value] };
    }

    if (isFlush) {
      return { rank: 5, description: 'Flush', kickers: sortedCards.slice(0, 5).map(c => c.value) };
    }

    if (isStraight) {
      return { rank: 4, description: 'Straight', kickers: [sortedCards[0].value] };
    }

    if (groups[0].length === 3) {
      const kickers = groups.slice(1).map(g => g[0].value).slice(0, 2);
      return { rank: 3, description: 'Three of a Kind', kickers: [groups[0][0].value, ...kickers] };
    }

    if (groups[0].length === 2 && groups[1].length === 2) {
      const kicker = groups.slice(2).map(g => g[0].value)[0];
      return { rank: 2, description: 'Two Pair', kickers: [groups[0][0].value, groups[1][0].value, kicker] };
    }

    if (groups[0].length === 2) {
      const kickers = groups.slice(1).map(g => g[0].value).slice(0, 3);
      return { rank: 1, description: 'One Pair', kickers: [groups[0][0].value, ...kickers] };
    }

    return { rank: 0, description: 'High Card', kickers: sortedCards.slice(0, 5).map(c => c.value) };
  }

  static checkFlush(cards) {
    const suits = {};
    cards.forEach(card => {
      suits[card.suit] = (suits[card.suit] || 0) + 1;
    });
    return Object.values(suits).some(count => count >= 5);
  }

  static checkStraight(cards) {
    const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      let consecutive = true;
      for (let j = 1; j < 5; j++) {
        if (uniqueValues[i + j] !== uniqueValues[i + j - 1] - 1) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return true;
    }

    if (uniqueValues.includes(14) && uniqueValues.includes(5) &&
        uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
      return true;
    }

    return false;
  }

  static groupByRank(cards) {
    const groups = {};
    cards.forEach(card => {
      if (!groups[card.value]) groups[card.value] = [];
      groups[card.value].push(card);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.length !== b.length) return b.length - a.length;
      return b[0].value - a[0].value;
    });
  }

  static compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
      return hand1.rank - hand2.rank;
    }

    for (let i = 0; i < Math.max(hand1.kickers.length, hand2.kickers.length); i++) {
      const k1 = hand1.kickers[i] || 0;
      const k2 = hand2.kickers[i] || 0;
      if (k1 !== k2) return k1 - k2;
    }

    return 0;
  }
}

module.exports = HandEvaluator;