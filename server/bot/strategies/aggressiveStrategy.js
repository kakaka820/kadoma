// server/bot/strategies/aggressiveStrategy.js
// 強気戦略：大きいカードから出す

const { rankToValue } = require('../../../shared/core/cardValue');

/**
 * 強気戦略でカードを選択（大きい順）
 * @param {Array} hand - 手札
 * @param {number} setTurnIndex - セット内ターン（0-4）
 * @param {Object} gameState - ゲーム状態
 * @returns {number} 選択したカードのインデックス
 */
function selectCard(hand, setTurnIndex, gameState = {}) {
  if (hand.length === 0) return -1;

  // セットの1ターン目はJOKER除外
  let validCards = hand.map((card, idx) => ({ card, idx }));
  
  if (setTurnIndex === 0) {
    validCards = validCards.filter(item => !item.card.rank?.startsWith('JOKER'));
    if (validCards.length === 0) {
      validCards = hand.map((card, idx) => ({ card, idx }));
    }
  }

  // 大きいカードから選択
  validCards.sort((a, b) => rankToValue(b.card) - rankToValue(a.card));
  return validCards[0].idx;
}

module.exports = { selectCard };