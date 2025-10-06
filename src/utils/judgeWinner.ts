// src/utils/judgeWinner.ts
//勝者判定ロジック　返し札の処理まで実装済

import { Card } from './deck';
import { isJoker } from './joker';

type JudgeResult = {
  winnerIndexes: number[];
  isDraw: boolean;
};

function rankToValue(rank: string): number {
  const order = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  if (rank.startsWith('JOKER')) return 99;
  return order.indexOf(rank) + 1;
}

export function judgeWinner(cards: (Card & { playerIndex: number })[]): JudgeResult {
  if (cards.length !== 3) return { winnerIndexes: [], isDraw: false };

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
    };
  }

  // 2. 通常の最大値勝負
  const cardValues = cards.map(card => ({
    value: rankToValue(card.rank),
    playerIndex: card.playerIndex,
    card: card.rank,
  }));

  const maxValue = Math.max(...cardValues.map(c => c.value));
  let winnerIndexes = cardValues
    .filter(c => c.value === maxValue)
    .map(c => c.playerIndex);

// 3. 絵札（J、Q、K）やJOKERの場合の逆転ルール
  // 勝者のカードが絵札（J、Q、K）またはJOKERなら逆転判定
  const winnerCard = cardValues.find(c => c.playerIndex === winnerIndexes[0]);
  const loserCard = cardValues.find(c => c.playerIndex !== winnerIndexes[0]);

  // 絵札（J、Q、K）またはJOKERの場合
  if (
    winnerCard &&
    (['J', 'Q', 'K', 'JOKER1', 'JOKER2'].includes(winnerCard.card))
  ) {
    // 逆転判定（カードに対応する逆転条件）
    if (winnerCard.card === 'J') {
      // J: 1, 5 で逆転
      if (loserCard && [1, 5].includes(rankToValue(loserCard.card))) {
        winnerIndexes = [loserCard.playerIndex];
        return { winnerIndexes, isDraw: false };
      }
    } else if (winnerCard.card === 'Q') {
      // Q: 2, 6 で逆転
      if (loserCard && [2, 6].includes(rankToValue(loserCard.card))) {
        winnerIndexes = [loserCard.playerIndex];
        return { winnerIndexes, isDraw: false };
      }
    } else if (winnerCard.card === 'K') {
      // K: 3, 7 で逆転
      if (loserCard && [3, 7].includes(rankToValue(loserCard.card))) {
        winnerIndexes = [loserCard.playerIndex];
        return { winnerIndexes, isDraw: false };
      }
    } else if (winnerCard.card.startsWith('JOKER')) {
      // JOKER: 4 で逆転
      if (loserCard && rankToValue(loserCard.card) === 4) {
        winnerIndexes = [loserCard.playerIndex];
        return { winnerIndexes, isDraw: false };
      }
    }
  }




  return {
    winnerIndexes,
    isDraw: winnerIndexes.length !== 1,
  };
}
