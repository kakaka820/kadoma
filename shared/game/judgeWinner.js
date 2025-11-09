// shared/game/judgeWinner.js
// 勝者判定ロジック　返し札の処理まで実装済
// ⚠️ このファイルはフロント・サーバー両方で使用

const { isJoker } = require('./joker');
const { rankToValue } = require('../core/cardValue');

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
    const rank = (card.rank === 'JOKER1' || card.rank === 'JOKER2') ? 'JOKER' : card.rank;
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
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
  const minValue = Math.min(...cardValues.map(c => c.value));
  
  const originalWinner = cardValues.find(c => c.value === maxValue);
  const originalLoser = cardValues.find(c => c.value === minValue);

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
    let canReverse = false;

    if (winnerCard.card === 'J') {
      // J: 敗者が 1 or 5 なら逆転
      canReverse = [1, 5].includes(originalLoser.value);
    } else if (winnerCard.card === 'Q') {
      // Q: 敗者が 2 or 6 なら逆転
      canReverse = [2, 6].includes(originalLoser.value);
    } else if (winnerCard.card === 'K') {
      // K: 敗者が 3 or 7 なら逆転
      canReverse = [3, 7].includes(originalLoser.value);
    } else if (winnerCard.card.startsWith('JOKER')) {
      // JOKER: 敗者が 4 なら逆転
      canReverse = originalLoser.value === 4;
    }


    if (canReverse) {
      // 逆転：敗者（最小値）が勝者になる
      winnerIndexes = [originalLoser.playerIndex];
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