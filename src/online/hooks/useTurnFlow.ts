// src/online/hooks/useTurnFlow.ts
// turn_updateとgame_overイベントの処理を担当

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card } from '../types/game';

interface UseTurnFlowProps {
  socket: Socket | null;
}

interface UseTurnFlowReturn {
  turnIndex: number;
  currentMultiplier: number;
  fieldCards: (Card | null)[];
}

export function useTurnFlow({ socket }: UseTurnFlowProps): UseTurnFlowReturn {
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [fieldCards, setFieldCards] = useState<(Card | null)[]>([null, null, null]);

  useEffect(() => {
    if (!socket) return;

    console.log('[useTurnFlow] Setting up event listeners');

    // ターン更新
    socket.on('turn_update', (data) => {
      console.log('[useTurnFlow] turn_update received:', data);
      setTurnIndex(data.turnIndex);
      setCurrentMultiplier(data.currentMultiplier);
      setFieldCards(data.fieldCards);
    });

    // ゲーム終了
    socket.on('game_over', (data) => {
      console.log('[useTurnFlow] game_over received:', data);
      alert(`ゲーム終了！\n理由: ${data.reason}\n勝者: Player ${data.winner + 1}`);
    });

    // クリーンアップ
    return () => {
      console.log('[useTurnFlow] Cleaning up event listeners');
      socket.off('turn_update');
      socket.off('game_over');
    };
  }, [socket]);

  return {
    turnIndex,
    currentMultiplier,
    fieldCards,
  };
}