//src/utils/scoreCalculator.ts
//得点計算ロジック（移動量だけ計算）




// src/utils/scoreCalculator.ts
import { Card } from './deck';
import { ANTE } from '../config';
import { rankToValue } from './cardValue';



// 基本的な得点計算
function calculateBaseScore(winnerCard: Card, loserCard:Card, multiplier: number): number {
  // ✅ 勝者のカードの数値 * 2 * multiplier * ANTE
  return (rankToValue(winnerCard) - rankToValue(loserCard)) * 2 * multiplier * ANTE;
}

// 逆転処理の条件に基づく得点計算
export function calculateScore(winnerCard: Card, loserCard: Card, multiplier: number, reverse: boolean): number {
  // JOKERに対して4の逆転
  if (loserCard.rank.startsWith('JOKER') && reverse) {
    return 100 * multiplier * ANTE;
  }

  // 絵札に対する逆転
  if (reverse) {
    if (loserCard.rank === 'J') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 1) return 30 * multiplier * ANTE; // Aでの逆転
      if (winnerValue === 5) return 25 * multiplier * ANTE; // 5での逆転
    } else if (loserCard.rank === 'Q') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 2) return 30 * multiplier * ANTE; // 2での逆転
      if (winnerValue === 6) return 25 * multiplier * ANTE; // 6での逆転
    } else if (loserCard.rank === 'K') {
      const winnerValue = rankToValue(winnerCard);
      if (winnerValue === 3) return 30 * multiplier * ANTE; // 3での逆転
      if (winnerValue === 7) return 25 * multiplier * ANTE; // 7での逆転
    }
  }

  // JOKERが勝った場合（逆転なし）
  if (winnerCard.rank.startsWith('JOKER') && !reverse) {
    return 50 * multiplier * ANTE;
  }

  return calculateBaseScore(winnerCard, loserCard, multiplier);
}
