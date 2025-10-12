// shared/utils/handUtils.js
// 手札関連のユーティリティ関数
// ⚠️ このファイルはフロント・サーバー両方で使用

/**
 * 絵札・JOKERかどうかを判定
 * @param {Object} card - Card型のオブジェクト
 * @returns {boolean}
 */
function isFaceCardOrJoker(card) {
  return ['J', 'Q', 'K', 'JOKER1', 'JOKER2'].includes(card.rank);
}

/**
 * 他プレイヤー用の手札情報を作成（絵札/JOKERのみ表示、他は裏向き）
 * @param {Array} hand - プレイヤーの手札
 * @returns {Array} OpponentCard[]
 */
function createOpponentHandInfo(hand) {
  return hand.map(card => {
    if (isFaceCardOrJoker(card)) {
      return { rank: card.rank, suit: card.suit, visible: true };
    }
    return { visible: false }; // 裏向き
  });
}

/**
 * 全プレイヤーの手札情報を配列で作成
 * @param {Array} hands - 全プレイヤーの手札配列
 * @returns {Array} OpponentCard[][]
 */
function createAllHandsInfo(hands) {
  return hands.map(hand => createOpponentHandInfo(hand));
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isFaceCardOrJoker,
    createOpponentHandInfo,
    createAllHandsInfo
  };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.HandUtils = {
    isFaceCardOrJoker,
    createOpponentHandInfo,
    createAllHandsInfo
  };
}