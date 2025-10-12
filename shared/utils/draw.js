// shared/draw.js
// カード配布ロジック
// ⚠️ このファイルはフロント・サーバー両方で使用

// カード比較用のヘルパー関数
const isSameCard = (card1, card2) => {
  return card1.suit === card2.suit && card1.rank === card2.rank;
};

// カードが配列内に存在するかチェック
const cardExistsIn = (card, cards) => {
  return cards.some(c => isSameCard(c, card));
};

// カードを均等に配る関数（15枚未満かつ3の倍数）
const evenlyDistribute = (deck, players) => {
  const newPlayers = players.map(p => ({ ...p, hand: [] }));
  const chunkSize = deck.length / players.length;

  for (let i = 0; i < players.length; i++) {
    newPlayers[i].hand = deck.slice(i * chunkSize, (i + 1) * chunkSize);
  }

  return newPlayers;
};

// 山札を完全リセットして配り直す（15枚未満・3で割れないとき）
const resetAndDeal = (players, createDeck, shuffleDeck) => {
  const newDeck = shuffleDeck(createDeck());
  const updatedPlayers = players.map((p, i) => ({
    ...p,
    hand: newDeck.slice(i * 5, (i + 1) * 5),
  }));
  const updatedDeck = newDeck.slice(players.length * 5);
  return { updatedPlayers, updatedDeck };
};

/**
 * 次のターンのカードを配る
 * @param {Array} deck - 山札
 * @param {Array} players - プレイヤー配列
 * @param {Function} createDeck - デッキ作成関数
 * @param {Function} shuffleDeck - シャッフル関数
 * @param {boolean} reshuffleForced - 強制リシャッフル
 * @returns {Object} { updatedPlayers, updatedDeck, drawStatus }
 */
const drawCardsForNextTurn = (
  deck,
  players,
  createDeck,
  shuffleDeck,
  reshuffleForced = false
) => {
  const allHandsEmpty = players.every(p => p.hand.length === 0);
  if (!allHandsEmpty) {
    return { updatedPlayers: players, updatedDeck: deck, drawStatus: 'ongoing' };
  }

  const playerCount = players.length;
  const drawCount = 5;

  // ✅ reshuffleForced が true のとき、無条件でリセット実行
  if (reshuffleForced) {
    console.log('[draw] JOKER検出により山札リセット');
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
    return { updatedPlayers, updatedDeck, drawStatus: 'warn' };
  }

  // 山札 15 枚未満
  if (deck.length % playerCount === 0) {
    console.log('[draw] 残り山札が15枚未満、均等配布後に使用済みカードから補充');
    
    const tempPlayers = evenlyDistribute(deck, players);
    const allCards = createDeck();
    const cardsInHands = tempPlayers.flatMap(p => p.hand);
    const cardsInDeck = deck;
    const usedCards = allCards.filter(card => 
      !cardExistsIn(card, cardsInHands) && !cardExistsIn(card, cardsInDeck)
    );

    console.log('[draw] 使用済みカード枚数:', usedCards.length);
    const reshuffled = shuffleDeck(usedCards);

    const finalPlayers = tempPlayers.map(p => {
      const needed = drawCount - p.hand.length;
      const extra = reshuffled.splice(0, needed);
      return { ...p, hand: [...p.hand, ...extra] };
    });

    return { updatedPlayers: finalPlayers, updatedDeck: reshuffled, drawStatus: 'reshuffled' };
  } else {
    console.log('[draw] 配布不可能、完全リセット');
    return {
      ...resetAndDeal(players, createDeck, shuffleDeck),
      drawStatus: 'reset'
    };
  }
};

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawCardsForNextTurn };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.DrawLogic = { drawCardsForNextTurn };
}