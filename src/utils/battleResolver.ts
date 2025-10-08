//勝者・敗者の特定ロジック(逆転判定も含めてここで処理)
// src/utils/battleResolver.ts
import { Card } from './deck';
import { rankToValue } from './cardValue';

export type BattleResult = {
  winnerIndex: number;
  loserIndex: number;
  winnerCard: Card;
  loserCard: Card;
  isReverse: boolean;
} | null;

/**
 * 勝者と敗者を特定する
 */
export function determineWinnerAndLoser(
  fieldCards: (Card | null)[],
  isDraw: boolean,
  winnerIndexes: number[],
  isReverse?: boolean,
  originalWinnerIndex?: number | undefined
): BattleResult {
  if (isDraw || winnerIndexes.length !== 1) {
    return null;
  }

  const winnerIndex = winnerIndexes[0];
  const winnerCard = fieldCards[winnerIndex];
  
  if (!winnerCard) {
    console.error('winnerCard not found!');
    return null;
  }
  
  let loserIndex: number;
  
  if (isReverse && originalWinnerIndex !== undefined) {
    loserIndex = originalWinnerIndex;
  } else {
    const cardsWithIndex = fieldCards.map((card, idx) => ({
      ...card!,
      playerIndex: idx
    }));
    
    const cardValues = cardsWithIndex.map(card => ({
      value: rankToValue(card),
      playerIndex: card.playerIndex,
      rank: card.rank,
    }));
    
    const minValue = Math.min(...cardValues.map(c => c.value));
    const loserData = cardValues.find(c => c.value === minValue);
    
    if (!loserData) {
      console.error('loserData not found!');
      return null;
    }
    
    loserIndex = loserData.playerIndex;
  }
  
  const loserCard = fieldCards[loserIndex];
  
  if (!loserCard) {
    console.error('loserCard not found!');
    return null;
  }

  return {
    winnerIndex,
    loserIndex,
    winnerCard,
    loserCard,
    isReverse: isReverse ?? false
  };
}

