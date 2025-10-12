// shared/game/multiplier.js
// 倍率計算ロジック
// ⚠️ このファイルはフロント・サーバー両方で使用

const { rankToNumber } = require('../core/cardValue');

/**
 * 次のターンの倍率を計算
 * @param {Array} cards - Card[]
 * @returns {number} 倍率
 */
function calculateNextMultiplier(cards) {
  if (cards.length < 2) return 0; // 判定対象が2枚以下なら追加倍率なし

  let multiplier = 0;

  // ① スート一致
  const allSameSuit = cards.every(card => card.suit === cards[0].suit);
  if (allSameSuit) multiplier += 1;

  // ② 数字連番（JOKERは無視）
  const numericCards = cards
    .filter(card => card.rank && !card.rank.startsWith('JOKER'))
    .map(card => rankToNumber(card.rank))
    .sort((a, b) => a - b);

  let isSequential = true;
  for (let i = 1; i < numericCards.length; i++) {
    if (numericCards[i] !== numericCards[i - 1] + 1) {
      isSequential = false;
      break;
    }
  }
  if (isSequential && numericCards.length === cards.length) {
    multiplier += 1;
  }

  // ③ 同じ数字のカードの枚数（2枚で+1、3枚で+2）
  const counts = {};
  for (const card of numericCards) {
    counts[card] = (counts[card] || 0) + 1;
  }

  const valueCounts = Object.values(counts);
  const hasTwoSame = valueCounts.includes(2);
  const hasThreeSame = valueCounts.includes(3);

  if (hasThreeSame) multiplier += 2;
  else if (hasTwoSame) multiplier += 1;

  return multiplier;
}



// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateNextMultiplier };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.Multiplier = { calculateNextMultiplier };
}