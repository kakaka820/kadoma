// src/utils/draw.ts
import { Card, Player } from './deck'; // deck.tsからCard型をインポート

// カードを均等に配る関数（15枚未満かつ3の倍数）
const evenlyDistribute = (deck: Card[], players: Player[]): Player[] => {
  const newPlayers = players.map(p => ({ ...p, hand: [] as Card[] }));
  const chunkSize = deck.length / players.length;

  for (let i = 0; i < players.length; i++) {
    newPlayers[i].hand = deck.slice(i * chunkSize, (i + 1) * chunkSize);
  }

  return newPlayers;
};

// 山札を完全リセットして配り直す（15枚未満・3で割れないとき）
const resetAndDeal = (
  players: Player[],
  createDeck: () => Card[],
  shuffleDeck: (cards: Card[]) => Card[]
): { updatedPlayers: Player[]; updatedDeck: Card[] } => {
  const newDeck = shuffleDeck(createDeck());
  const updatedPlayers = players.map((p, i) => ({
    ...p,
    hand: newDeck.slice(i * 5, (i + 1) * 5),
  }));
  const updatedDeck = newDeck.slice(players.length * 5);
  return { updatedPlayers, updatedDeck };
};

// メイン関数
export const drawCardsForNextTurn = (
  deck: Card[],
  players: Player[],
  createDeck: () => Card[],
  shuffleDeck: (cards: Card[]) => Card[],
  reshuffleForced: boolean = false 
) => {
  const allHandsEmpty = players.every(p => p.hand.length === 0);
  if (!allHandsEmpty) {
    return { updatedPlayers: players, updatedDeck: deck, wasLastRound: false };
  }

  const playerCount = players.length;
  const drawCount = 5;

   // 🔽 reshuffleForced が true のとき、無条件でリセット実行
  if (reshuffleForced) {
    const newDeck = shuffleDeck(createDeck());
    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: newDeck.slice(i * drawCount, (i + 1) * drawCount),
    }));
    const updatedDeck = newDeck.slice(playerCount * drawCount);
    return { updatedPlayers, updatedDeck, drawStatus: 'reshuffled' };
  }


  // 山札 30 枚以上 → 通常配布
  if (deck.length >= 30) {
    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: deck.slice(i * drawCount, (i + 1) * drawCount),
    }));
    const updatedDeck = deck.slice(playerCount * drawCount);
    return { updatedPlayers, updatedDeck, drawStatus: 'normal' };
  }

  // 山札 15〜29 枚 → 警告演出 + 通常配布
  if (deck.length >= 15) {
    const updatedPlayers = players.map((p, i) => ({
      ...p,
      hand: deck.slice(i * drawCount, (i + 1) * drawCount),
    }));
    const updatedDeck = deck.slice(playerCount * drawCount);
    // 返り値の型を変更：
    return { updatedPlayers, updatedDeck, drawStatus: 'warn' };
  }

  // 山札 15 枚未満
  if (deck.length % playerCount === 0) {
    // 均等配布して、残りカードから補充処理
    const tempPlayers = evenlyDistribute(deck, players);

    // 手元にないカードを山札として再利用
    // deck全体を定義（createDeck() で新しいデッキを作る）
const allCards = createDeck();

// 現在プレイヤーが持っているカード
const cardsInHands = tempPlayers.flatMap(p => p.hand);

// 使用済みカード = 全カード - 現在の山札 - 現在の手札
const usedCards = allCards.filter(card =>
  !deck.includes(card) && !cardsInHands.includes(card)
);
const reshuffled = shuffleDeck(usedCards);



    // 各プレイヤーが5枚になるまで追加配布
    const finalPlayers = tempPlayers.map(p => {
      const needed = drawCount - p.hand.length;
      const extra = reshuffled.splice(0, needed);
      return { ...p, hand: [...p.hand, ...extra] };
    });

    return { updatedPlayers: finalPlayers, updatedDeck: reshuffled, drawStatus: 'reshuffled' };
  } else {
    // 配れない → 完全リセット
    return {
      ...resetAndDeal(players, createDeck, shuffleDeck),
      drawStatus: 'reset'
    };
  }
};