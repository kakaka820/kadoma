//勝敗判定フック

import { useState, useEffect } from 'react';
import { Player, Card } from '../utils/deck';


interface CardWithIndex extends Card {
  playerIndex: number;
}

interface JudgeResult {
  winnerIndexes: number[];
  isDraw: boolean;
  isReverse?: boolean;
  originalWinnerIndex?: number;
}

interface UseRoundJudgeProps {
  fieldCards: (Card | null)[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  judgeWinner: (cards: CardWithIndex[]) => JudgeResult;
  calculateNextMultiplier: (cards: CardWithIndex[]) => number;
}

interface UseRoundJudgeReturn {
  roundResult: string | null;
  setRoundResult: React.Dispatch<React.SetStateAction<string | null>>;
  nextMultiplier: number;
  setNextMultiplier: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 勝敗判定を管理するフック
 * roundResult, nextMultiplier の管理と勝者判定を担当
 */
export function useRoundJudge({
  fieldCards,
  players,
  setPlayers,
  judgeWinner,
  calculateNextMultiplier,
}: UseRoundJudgeProps): UseRoundJudgeReturn {
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [nextMultiplier, setNextMultiplier] = useState(1);

  // 勝者判定処理
  useEffect(() => {
    const allCardsPlayed = fieldCards.every((card) => card !== null);

    if (allCardsPlayed && roundResult === null) {
      console.log('[useRoundJudge] 全カード出揃い、勝者判定開始');

      const cardsWithIndex: CardWithIndex[] = fieldCards.map((card, idx) => ({
        ...card!,
        playerIndex: idx,
      }));

      const result = judgeWinner(cardsWithIndex);
      const { winnerIndexes, isDraw } = result;

      // 結果テキストの設定
      let resultText = '';
      if (isDraw) {
        resultText = `このターンは引き分け`;
      } else {
        resultText = `このターンの勝者: Player ${winnerIndexes[0] + 1}`;
      }
      setRoundResult(resultText);
      console.log('[useRoundJudge] 判定結果:', resultText);

      // 勝利数の更新
      if (!isDraw && winnerIndexes.length === 1) {
        const winnerIndex = winnerIndexes[0];
        setPlayers((prev) =>
          prev.map((p, i) => (i === winnerIndex ? { ...p, wins: (p.wins || 0) + 1 } : p))
        );
        console.log('[useRoundJudge] Player', winnerIndex + 1, 'の勝利数を更新');
      }

      // 次の倍率の計算
      const newMultiplier = calculateNextMultiplier(cardsWithIndex);
      if (newMultiplier > 0) {
        setNextMultiplier((prev) => {
          const updated = prev + newMultiplier;
          console.log('[useRoundJudge] 倍率更新:', prev, '→', updated);
          return updated;
        });
      } else {
        setNextMultiplier(1);
        console.log('[useRoundJudge] 倍率リセット: 1');
      }
    }
  }, [fieldCards, roundResult, judgeWinner, calculateNextMultiplier, setPlayers]);

  return {
    roundResult,
    setRoundResult,
    nextMultiplier,
    setNextMultiplier,
  };
}
