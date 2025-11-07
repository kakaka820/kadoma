// shared/utils/feeCalculator.js
// 場代の計算（純粋な計算関数、入力→出力）
// ⚠️ このファイルはフロント・サーバー両方で使用

const { ANTE } = require('../config');


/**
 * プレイヤーごとの場代を計算
 */
function calculateTableFee(playerIndex, previousResult, playerCount = 3, ante = ANTE) {
  if (previousResult === null) {
    console.log(`[場代] 1ターン目 - Player ${playerIndex + 1}: ante * 1`);
    return ante * 1;
  }

  if (previousResult.isDraw) {
    console.log(`[場代] 引き分け - Player ${playerIndex + 1}: ante * 1`);
    return ante * 1;
  }

  if (previousResult.winnerIndex === playerIndex) {
    console.log(`[場代] 勝者 - Player ${playerIndex + 1}: 0`);
    return 0;
  }

  if (previousResult.loserIndex === playerIndex) {
    console.log(`[場代] 敗者 - Player ${playerIndex + 1}: ante * 2`);
    return ante * 2;
  }

  console.log(`[場代] その他 - Player ${playerIndex + 1}: ante * 1`);
  return ante * 1;
}

/**
 * 全プレイヤーの場代を一括計算
 */
function calculateAllTableFees(previousResult, playerCount = 3, ante = ANTE) {
  console.log('[場代計算] 開始:', previousResult, 'ante:', ante);
  
  const fees = Array.from({ length: playerCount }, (_, i) => 
    calculateTableFee(i, previousResult, playerCount, ante)
  );
  
  console.log('[場代計算] 結果:', fees);
  return fees;
}

// CommonJS (Node.js用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateTableFee, calculateAllTableFees };
}

// ES Module (ブラウザ用)
if (typeof window !== 'undefined') {
  window.FeeCalculator = { calculateTableFee, calculateAllTableFees };
}