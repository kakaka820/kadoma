// shared/cardValue.js
// rankToValue関数を配置 = カードのランクを数値に変換する関数
// ⚠️ このファイルはフロント・サーバー両方で使用

/**
 * カードのランクを数値に変換
 * @param {Object} card - Card型のオブジェクト
 * @returns {number} カードの強さ（1-15）
 */
function rankToValue(card) {
  if (!card.rank) return 0;
  if (card.rank === 'JOKER1' || card.rank === 'JOKER2') return 15;
  const order = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return order.indexOf(card.rank) + 1;
}

/**
 * ランク文字列を数値に変換（文字列版）
 * @param {string} rank - ランク文字列（'A', '2', ..., 'K', 'JOKER1', 'JOKER2'）
 * @returns {number} カードの強さ（1-15）
 */
function rankToNumber(rank) {
  if (rank === 'JOKER1' || rank === 'JOKER2') return 15;
  const order = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return order.indexOf(rank) + 1;
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rankToValue, rankToNumber };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.CardValue = { rankToValue, rankToNumber };
}