// shared/battleResolver.js
// 勝者・敗者の特定ロジック（逆転判定も含めてここで処理）
// ⚠️ このファイルはフロント・サーバー両方で使用

const { rankToValue } = require('./cardValue');

/**
 * 勝者と敗者を特定する
 * @param {Array} fieldCards - (Card | null)[]
 * @param {boolean} isDraw - 引き分けかどうか
 * @param {Array} winnerIndexes - 勝者のインデックス配列
 * @param {boolean} isReverse - 逆転したかどうか
 * @param {number} originalWinnerIndex - 元の勝者インデックス
 * @returns {Object|null} BattleResult or null
 */
function determineWinnerAndLoser(
  fieldCards,
  isDraw,
  winnerIndexes,
  isReverse,
  originalWinnerIndex
) {
  if (isDraw || winnerIndexes.length !== 1) {
    return null;
  }

  const winnerIndex = winnerIndexes[0];
  const winnerCard = fieldCards[winnerIndex];
  
  if (!winnerCard) {
    console.error('winnerCard not found!');
    return null;
  }
  
  let loserIndex;
  
  if (isReverse && originalWinnerIndex !== undefined) {
    loserIndex = originalWinnerIndex;
  } else {
    const cardsWithIndex = fieldCards.map((card, idx) => ({
      ...card,
      playerIndex: idx
    }));
    
    const cardValues = cardsWithIndex.map(card => ({
      value: rankToValue(card),
      playerIndex: card.playerIndex,
      rank: card.rank,
    }));
    
    const minValue = Math.min(...cardValues.map(c => c.value));
    const loserData = cardValues.find(c => c.value === minValue);
    
    if (!loserData) {
      console.error('loserData not found!');
      return null;
    }
    
    loserIndex = loserData.playerIndex;
  }
  
  const loserCard = fieldCards[loserIndex];
  
  if (!loserCard) {
    console.error('loserCard not found!');
    return null;
  }

  return {
    winnerIndex,
    loserIndex,
    winnerCard,
    loserCard,
    isReverse: isReverse ?? false
  };
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { determineWinnerAndLoser };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.BattleResolver = { determineWinnerAndLoser };
}