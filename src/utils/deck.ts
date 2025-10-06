// src/utils/deck.ts
//デッキ作成・シャッフル機能
//山札処理修正済（まだ本確認はできてません）

export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const JOKERS = ['JOKER1', 'JOKER2'] as const;

export type Card = {
  suit: string | null;
  rank: string;
  playerIndex?: number;
};

export type Player = {
  name: string;
  hand: Card[];
  wins: number;
  points: number;
};


export function createDeck(): Card[] {
  const deck: Card[] = [];
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

export function shuffleDeck(deck: Card[]): Card[] {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
