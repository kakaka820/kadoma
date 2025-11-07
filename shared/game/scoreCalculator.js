// shared/game/scoreCalculator.js
// 得点計算ロジック（移動量だけ計算）
// ⚠️ このファイルはフロント・サーバー両方で使用

const { rankToValue } = require('../core/cardValue');
const { ANTE } = require('../config');
/**
 * 基本的な得点計算
 */
function calculateBaseScore(winnerCard, loserCard, multiplier, ante = ANTE) {
  return (rankToValue(winnerCard) - rankToValue(loserCard)) * 2 * multiplier * ante;
}

/**
 * 逆転処理の条件に基づく得点計算
 * @param {Object} winnerCard - 勝者のカード
 * @param {Object} loserCard - 敗者のカード
 * @param {number} multiplier - 倍率
 * @param {boolean} reverse - 逆転したかどうか
 * @returns {number} 得点
 */
function calculateScore(winnerCard, loserCard, multiplier, reverse, ante = ANTE) {
  // JOKERに対して4の逆転
  if (loserCard.rank.startsWith('JOKER') && reverse) {
    return 100 * multiplier * ante;
  }

  // 絵札に対する逆転
  if (reverse) {
    if (loserCard.rank === 'J') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 1) return 30 * multiplier * ante; // Aでの逆転
      if (winnerValue === 5) return 25 * multiplier * ante; // 5での逆転
    } else if (loserCard.rank === 'Q') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 2) return 30 * multiplier * ante; // 2での逆転
      if (winnerValue === 6) return 25 * multiplier * ante; // 6での逆転
    } else if (loserCard.rank === 'K') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 3) return 30 * multiplier * ante; // 3での逆転
      if (winnerValue === 7) return 25 * multiplier * ante; // 7での逆転
    }
  }

  // JOKERが勝った場合（逆転なし）
  if (winnerCard.rank.startsWith('JOKER') && !reverse) {
    return 50 * multiplier * ante;
  }

  return calculateBaseScore(winnerCard, loserCard, multiplier, ante);
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateScore, calculateBaseScore };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.ScoreCalculator = { calculateScore, calculateBaseScore };
}