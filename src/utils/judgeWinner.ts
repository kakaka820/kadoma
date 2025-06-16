// src/utils/judgeWinner.ts

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
  }));

  const maxValue = Math.max(...cardValues.map(c => c.value));
  const winnerIndexes = cardValues
    .filter(c => c.value === maxValue)
    .map(c => c.playerIndex);

  return {
    winnerIndexes,
    isDraw: winnerIndexes.length !== 1,
  };
}
