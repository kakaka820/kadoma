// src/utils/gameLogic.ts
//ゲームの進行 わからんけどなんかめっちゃ赤なるので一旦すべてをコメントアウトします
//多分現状使われていないです（2025年10月7日現在）



import { Player } from './deck';
import { calculateScore } from './scoreCalculator';
import { calculateAllTableFees } from './feeCalculator';
import { Card } from './deck';

export function processTurn(
  winnerCard: Card,
  loserCard: Card,
  winner: Player,
  loser: Player,
  multiplier: number,
  players: Player[],
  reverse: boolean,
) {
  // 得点計算
  const score = calculateScore(winnerCard, loserCard, multiplier, reverse);

  /*
  // 場代計算（一時的にコメントアウトしてます：計算処理があってれば本文に戻す）
  const fees = calculateFee(winner, loser, players);

  */

  // 勝者と敗者に得点を反映
  winner.points += score; // 勝者の得点追加
  loser.points -= score; // 敗者の得点引き落とし

  /*

  // 追加の場代を勝者と敗者に適用（同上）
  winner.points -= fees[players.indexOf(winner)];
  loser.points += fees[players.indexOf(loser)];

*/

  return { updatedPlayers: players, winner, loser };
}
