//場代徴収ロジックの管理
//状態管理と徴収タイミングの制御

import { useState, useEffect } from 'react';
import { Player, Card } from '../utils/deck';
import { PreviousTurnResult } from '../utils/feeCalculator';


interface UseTableFeesProps {
  turnCount: number;
  roundResult: string | null;
  fieldCards: (Card | null)[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  calculateAllTableFees: (prevResult: PreviousTurnResult | null, playerCount: number) => number[];
  isInitialized: boolean;
  gameOver: boolean;
}

interface UseTableFeesReturn {
  previousTurnResult: PreviousTurnResult | null;
  setPreviousTurnResult: React.Dispatch<React.SetStateAction<PreviousTurnResult | null>>;
  feeCollected: boolean;
  setFeeCollected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useTableFees({
  turnCount,
  roundResult,
  fieldCards,
  players,
  setPlayers,
  calculateAllTableFees,
  isInitialized,
  gameOver,
}: UseTableFeesProps): UseTableFeesReturn {
  const [previousTurnResult, setPreviousTurnResult] = useState<PreviousTurnResult | null>(null);
  const [feeCollected, setFeeCollected] = useState(false);

  // 初期化完了時に場代徴収済みフラグを立てる
  useEffect(() => {
    if (isInitialized && turnCount === 0) {
      setFeeCollected(true);
      console.log('[useTableFees] 初期化完了：場代徴収済みフラグ設定');
    }
  }, [isInitialized, turnCount]);

  // 場代徴収処理
  useEffect(() => {
    //ゲーム終了時はスキップ
    if ( gameOver ) return;
    // 1ターン目はスキップ（初期化時に徴収済み）
    if (turnCount === 0) return;

    // すでに徴収済みの場合はスキップ
    if (feeCollected) return;

    // roundResultが表示されている間はスキップ
    if (roundResult !== null) return;

    // すでにカードが出されている場合はスキップ
    if (fieldCards.some((card) => card !== null)) return;

    console.log('[useTableFees] 場代徴収開始');
    console.log('[useTableFees] turnCount:', turnCount);
    console.log('[useTableFees] previousTurnResult:', previousTurnResult);

    const tableFees = calculateAllTableFees(previousTurnResult, players.length);

    setPlayers((prev) => {
      const updated = prev.map((player, idx) => ({
        ...player,
        points: player.points - tableFees[idx],
      }));
      console.log(
        '[useTableFees] 場代徴収後のプレイヤーポイント:',
        updated.map((p) => ({ name: p.name, points: p.points }))
      );
      return updated;
    });

    setFeeCollected(true);
  }, [
    gameOver,
    turnCount,
    feeCollected,
    roundResult,
    fieldCards,
    previousTurnResult,
    players.length,
    calculateAllTableFees,
    setPlayers,
  ]);

  return {
    previousTurnResult,
    setPreviousTurnResult,
    feeCollected,
    setFeeCollected,
  };
}
