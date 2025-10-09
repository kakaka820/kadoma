// shared/deckLogic.js
// ⚠️ このファイルは参照専用！直接編集禁止！

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const JOKERS = ['JOKER1', 'JOKER2'];

function createDeck() {
  const deck = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank });
    });
  });
  JOKERS.forEach(joker => {
    deck.push({ suit: null, rank: joker });
  });
  return deck;
}

function shuffleDeck(deck) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDeck, shuffleDeck, SUITS, RANKS, JOKERS };
}

// ES Module (ブラウザ用) - 将来的に使えるように
if (typeof window !== 'undefined') {
  window.DeckLogic = { createDeck, shuffleDeck, SUITS, RANKS, JOKERS };
}
