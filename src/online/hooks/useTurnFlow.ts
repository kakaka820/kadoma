// src/online/hooks/useTurnFlow.ts
// ターンフロー（同時プレイ用：選択状態、倍率、場札）の管理

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card } from '../types/game';

interface UseTurnFlowProps {
  socket: Socket | null;
}

interface UseTurnFlowReturn {
  currentMultiplier: number;
  fieldCards: (Card | null)[];
  playerSelections: boolean[];
  setTurnIndex: number;
  timeRemaining: number;
  timeLimit: number;
}

export function useTurnFlow({ socket }: UseTurnFlowProps): UseTurnFlowReturn {
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [playerSelections, setPlayerSelections] = useState<boolean[]>([false, false, false]);
  const [setTurnIndex, setSetTurnIndex] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(8);

  useEffect(() => {
    if (!socket) return;

    console.log('[useTurnFlow] Setting up event listeners');

   //新規追加：全員選択後の一斉開示
    socket.on('cards_revealed', (data) => {
      console.log('[useTurnFlow] cards_revealed received:', data);
      setFieldCards(data.fieldCards);
    });

    // ターン更新（選択状態、倍率、場札）
    socket.on('turn_update', (data) => {
      console.log('[useTurnFlow] turn_update received:', data);
      setCurrentMultiplier(data.currentMultiplier || 1);
      setFieldCards(data.fieldCards || [null, null, null]);
      setPlayerSelections(data.playerSelections || [false, false, false]);
      setSetTurnIndex(data.setTurnIndex);
    });

    // ラウンド結果後、場札をクリア
    socket.on('round_result', () => {
      console.log('[useTurnFlow] round_result received, clearing field cards');
      setFieldCards([null, null, null]);
    });

    //タイマー開始イベント
    socket.on('timer_start', (data) => {
      console.log('[useTurnFlow] timer_start received:', data);
      setTimeLimit(data.timeLimit);
      setTimeRemaining(data.timeLimit);
    });

    // クリーンアップ
    return () => {
      console.log('[useTurnFlow] Cleaning up event listeners');
      socket.off('card_played');
      socket.off('turn_update');
      socket.off('round_result');
      socket.off('timer_start');
    };
  }, [socket]);

  //タイマーのカウントダウン
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  return {
    currentMultiplier,
    fieldCards,
    playerSelections,
    setTurnIndex,
    timeRemaining,
    timeLimit,
  };
}
