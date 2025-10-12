// shared/game/joker.js
// ジョーカー判定と関連ロジック
// ⚠️ このファイルはフロント・サーバー両方で使用

const { MAX_JOKER_COUNT, MIN_POINTS } = require('../config');

/**
 * ジョーカーかどうかを判定するユーティリティ関数
 */
function isJoker(card) {
  return card.rank === 'JOKER1' || card.rank === 'JOKER2';
}

/**
 * カード配列の中にジョーカーが含まれているかを判定
 */
function hasJoker(cards) {
  return cards.some(isJoker);
}

/**
 * プレイヤーの手札にジョーカーが含まれているかを判定
 */
function checkJokerInHands(players) {
  console.log('[checkJokerInHands] プレイヤー数:', players.length);
  
  const result = players.some(player => {
    const playerHasJoker = hasJoker(player.hand);
    console.log(`[checkJokerInHands] ${player.name} の手札:`, player.hand.map(c => c.rank));
    console.log(`[checkJokerInHands] ${player.name} にJOKER:`, playerHasJoker);
    return playerHasJoker;
  });
  
  console.log('[checkJokerInHands] 最終結果:', result);
  return result;
}

/**
 * 場のカードにジョーカーが含まれているかを判定
 */
function checkJokerInField(fieldCards) {
  const validCards = fieldCards.filter(card => card !== null);
  return hasJoker(validCards);
}

/**
 * 任意のカード配列の中にあるジョーカーの数をカウント
 */
function countJokers(cards) {
  return cards.filter(isJoker).length;
}

/**
 * セット終了時にジョーカーが配られていた場合、山札リセットが必要か判定
 */
function shouldReshuffleAfterSet(jokerDealtThisSet) {
  console.log('[shouldReshuffleAfterSet] jokerDealtThisSet:', jokerDealtThisSet);
  return jokerDealtThisSet;
}

/**
 * JOKERが出せるかどうかを判定
 * @param {Object} card - 判定するカード
 * @param {number} setTurnIndex - 現在のセット内ターン（0~4）
 * @returns {boolean} 出せる場合true
 */
function canPlayJoker(card, setTurnIndex) {
  // JOKERでない場合は常に出せる
  if (!isJoker(card)) {
    return true;
  }
  
  // JOKERの場合、セットの1ターン目（setTurnIndex === 0）は出せない
  return setTurnIndex !== 0;
}

/**
 * プレイヤーの得点が0以下かどうかチェック
 */
function hasPlayerBelowMinPoints(players) {
  return players.some(player => player.points <= MIN_POINTS);
}

/**
 * ゲーム終了条件を判定
 * @param {boolean} allHandsEmpty - 全員の手札が空かどうか
 * @param {number} jokerCount - JOKERカウント
 * @param {Array} players - プレイヤー配列
 * @returns {Object} 終了条件と理由 { shouldEnd, reason }
 */
function checkGameEnd(allHandsEmpty, jokerCount, players) {
  // 条件1: 誰かの得点が0以下
  if (hasPlayerBelowMinPoints(players)) {
    const bankruptPlayer = players.find(p => p.points <= MIN_POINTS);
    return {
      shouldEnd: true,
      reason: `${bankruptPlayer?.name}の得点が${MIN_POINTS}以下になりました`
    };
  }

  // 条件2: 全員の手札が空 かつ JOKERが規定回数以上出た
  if (allHandsEmpty && jokerCount >= MAX_JOKER_COUNT) {
    return {
      shouldEnd: true,
      reason: `JOKERが${MAX_JOKER_COUNT}回出ました`
    };
  }

  return { shouldEnd: false };
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isJoker,
    hasJoker,
    checkJokerInHands,
    checkJokerInField,
    countJokers,
    shouldReshuffleAfterSet,
    canPlayJoker,
    hasPlayerBelowMinPoints,
    checkGameEnd,
    MAX_JOKER_COUNT,
    MIN_POINTS
  };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.JokerLogic = {
    isJoker,
    hasJoker,
    checkJokerInHands,
    checkJokerInField,
    countJokers,
    shouldReshuffleAfterSet,
    canPlayJoker,
    hasPlayerBelowMinPoints,
    checkGameEnd,
    MAX_JOKER_COUNT,
    MIN_POINTS
  };
}