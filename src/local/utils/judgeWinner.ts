// src/utils/judgeWinner.ts
//勝者判定ロジック　返し札の処理まで実装済

import { Card } from './deck';
import { isJoker } from './joker';
import { rankToValue } from './cardValue';  
import { CardWithIndex, JudgeResult } from '../types/game';  



export function judgeWinner(cards:CardWithIndex[]): JudgeResult {
  if (cards.length !== 3) return { winnerIndexes: [], isDraw: false, isReverse: false };

  // 1. 数字の重複 or ジョーカー同士が出ている場合 → 引き分け
  const rankCounts: Record<string, number> = {};
  for (const card of cards) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }

  const hasDuplicate = Object.values(rankCounts).some(count => count > 1);
  if (hasDuplicate) {
    return {
      winnerIndexes: cards.map(card => card.playerIndex),
      isDraw: true,
      isReverse: false,
    };
  }

  // 2. 通常の最大値勝負
  const cardValues = cards.map(card => ({
    value: rankToValue(card),
    playerIndex: card.playerIndex,
    card: card.rank,
  }));

  const maxValue = Math.max(...cardValues.map(c => c.value));
  const minValue = Math.min(...cardValues.map(c => c.value));
  const originalLoser = cardValues.find(c => c.value === minValue);
  let winnerIndexes = cardValues
    .filter(c => c.value === maxValue)
    .map(c => c.playerIndex);

    //元の勝者を保持
    const originalWinnerIndex = winnerIndexes[0];
    let isReverse = false;

// 3. 絵札（J、Q、K）やJOKERの場合の逆転ルール
  // 勝者のカードが絵札（J、Q、K）またはJOKERなら逆転判定
  const winnerCard = cardValues.find(c => c.playerIndex === winnerIndexes[0]);
  const loserCard = cardValues.find(c => c.playerIndex !== winnerIndexes[0]);

  // 絵札（J、Q、K）またはJOKERの場合
  if (
    winnerCard && originalLoser !== undefined &&
    (['J', 'Q', 'K', 'JOKER1', 'JOKER2'].includes(winnerCard.card))
  ) {
    // 逆転判定（カードに対応する逆転条件）
     // 逆転条件のカードを探す（複数ある場合は最も強いものを選ぶ）
     let canReverse = false;

if (winnerCard.card === 'J') {
  canReverse = [1, 5].includes(originalLoser.value);
} else if (winnerCard.card === 'Q') {
  canReverse = [2, 6].includes(originalLoser.value);
} else if (winnerCard.card === 'K') {
  canReverse = [3, 7].includes(originalLoser.value);
} else if (winnerCard.card.startsWith('JOKER')) {
  canReverse = originalLoser.value === 4;
}

if (canReverse) {
  winnerIndexes = [originalLoser.playerIndex];
  isReverse = true;
}
      

  
    }
  




  return {
    winnerIndexes,
    isDraw: winnerIndexes.length !== 1,
    isReverse,
    originalWinnerIndex: isReverse ? originalWinnerIndex : undefined,
  };}