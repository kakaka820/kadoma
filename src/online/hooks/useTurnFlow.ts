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
}

export function useTurnFlow({ socket }: UseTurnFlowProps): UseTurnFlowReturn {
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);
  const [playerSelections, setPlayerSelections] = useState<boolean[]>([false, false, false]);
  const [setTurnIndex, setSetTurnIndex] = useState<number>(0);

  useEffect(() => {
    if (!socket) return;

    console.log('[useTurnFlow] Setting up event listeners');

    // カードが出されたとき
    socket.on('card_played', (data) => {
      console.log('[useTurnFlow] card_played received:', data);
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

    // クリーンアップ
    return () => {
      console.log('[useTurnFlow] Cleaning up event listeners');
      socket.off('card_played');
      socket.off('turn_update');
      socket.off('round_result');
    };
  }, [socket]);

  return {
    currentMultiplier,
    fieldCards,
    playerSelections,
    setTurnIndex,
  };
}
