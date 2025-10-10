// src/utils/feeCalculator.ts
// 場代の計算(純粋な計算関数、入力→出力)


import { ANTE } from '../config';
import { PreviousTurnResult } from '../types/game';



export function calculateTableFee(
  playerIndex: number,
  previousResult: PreviousTurnResult | null,
  playerCount: number = 3
): number {
  // 1ターン目の場合: 全員からANTE*1
  if (previousResult === null) {
    console.log(`[場代] 1ターン目 - Player ${playerIndex + 1}: ANTE * 1`);
    return ANTE * 1;
  }

  // 引き分けの場合: 全員からANTE*1
  if (previousResult.isDraw) {
    console.log(`[場代] 引き分け - Player ${playerIndex + 1}: ANTE * 1`);
    return ANTE * 1;
  }

  // 勝者の場合: 徴収なし
  if (previousResult.winnerIndex === playerIndex) {
    console.log(`[場代] 勝者 - Player ${playerIndex + 1}: 0`);
    return 0;
  }

  // 敗者の場合: ANTE*2
  if (previousResult.loserIndex === playerIndex) {
    console.log(`[場代] 敗者 - Player ${playerIndex + 1}: ANTE * 2`);
    return ANTE * 2;
  }

  // その他（勝敗に関わらなかった人）: ANTE*1
  console.log(`[場代] その他 - Player ${playerIndex + 1}: ANTE * 1`);
  return ANTE * 1;
}

/**
 * 全プレイヤーの場代を一括計算
 * @param previousResult - 前のターンの結果
 * @param playerCount - プレイヤー数
 * @returns プレイヤーごとの場代配列
 */
export function calculateAllTableFees(
  previousResult: PreviousTurnResult | null,
  playerCount: number = 3
): number[] {
  console.log('[場代計算] 開始:', previousResult);
  
  const fees = Array.from({ length: playerCount }, (_, i) => 
    calculateTableFee(i, previousResult, playerCount)
  );
  
  console.log('[場代計算] 結果:', fees);
  return fees;
}