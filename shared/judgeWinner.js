// shared/judgeWinner.js
// 勝者判定ロジック　返し札の処理まで実装済
// ⚠️ このファイルはフロント・サーバー両方で使用

const { isJoker } = require('./joker');
const { rankToValue } = require('./cardValue');

/**
 * 勝者を判定する
 * @param {Array} cards - CardWithIndex[]
 * @returns {Object} JudgeResult { winnerIndexes, isDraw, isReverse, originalWinnerIndex }
 */
function judgeWinner(cards) {
  if (cards.length !== 3) {
    return { 
      winnerIndexes: [], 
      isDraw: false, 
      isReverse: false 
    };
  }

  // 1. 数字の重複 or ジョーカー同士が出ている場合 → 引き分け
  const rankCounts = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }

  const hasDuplicate = Object.values(rankCounts).some(count => count > 1);
  if (hasDuplicate) {
    return {
      winnerIndexes: cards.map(card => card.playerIndex),
      isDraw: true,
      isReverse: false,
    };
  }

  // 2. 通常の最大値勝負
  const cardValues = cards.map(card => ({
    value: rankToValue(card),
    playerIndex: card.playerIndex,
    card: card.rank,
  }));

  const maxValue = Math.max(...cardValues.map(c => c.value));
  let winnerIndexes = cardValues
    .filter(c => c.value === maxValue)
    .map(c => c.playerIndex);

  // 元の勝者を保持
  const originalWinnerIndex = winnerIndexes[0];
  let isReverse = false;

  // 3. 絵札（J、Q、K）やJOKERの場合の逆転ルール
  const winnerCard = cardValues.find(c => c.playerIndex === winnerIndexes[0]);

  // 絵札（J、Q、K）またはJOKERの場合
  if (
    winnerCard &&
    ['J', 'Q', 'K', 'JOKER1', 'JOKER2'].includes(winnerCard.card)
  ) {
    let reverseCards = [];

    if (winnerCard.card === 'J') {
      // J: 1, 5 で逆転
      reverseCards = cardValues.filter(
        c => c.playerIndex !== winnerIndexes[0] && [1, 5].includes(c.value)
      );
    } else if (winnerCard.card === 'Q') {
      // Q: 2, 6 で逆転
      reverseCards = cardValues.filter(
        c => c.playerIndex !== winnerIndexes[0] && [2, 6].includes(c.value)
      );
    } else if (winnerCard.card === 'K') {
      // K: 3, 7 で逆転
      reverseCards = cardValues.filter(
        c => c.playerIndex !== winnerIndexes[0] && [3, 7].includes(c.value)
      );
    } else if (winnerCard.card.startsWith('JOKER')) {
      // JOKER: 4 で逆転
      reverseCards = cardValues.filter(
        c => c.playerIndex !== winnerIndexes[0] && c.value === 4
      );
    }

    if (reverseCards.length > 0) {
      const minReverseCard = reverseCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );
      winnerIndexes = [minReverseCard.playerIndex];
      isReverse = true;
    }
  }

  return {
    winnerIndexes,
    isDraw: winnerIndexes.length !== 1,
    isReverse,
    originalWinnerIndex: isReverse ? originalWinnerIndex : undefined,
  };
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { judgeWinner };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.JudgeWinner = { judgeWinner };
}