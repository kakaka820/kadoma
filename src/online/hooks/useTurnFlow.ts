// src/online/hooks/useTurnFlow.ts
// turn_updateとgame_overイベント,card_played,game_startイベントの処理を担当

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

    // ゲーム開始 - turnIndexを初期化
    socket.on('game_start', (data) => {
      console.log('[useTurnFlow] game_start received:', data);
      setTurnIndex(data.turnIndex || 0);
    });
    // カードが出された
    socket.on('card_played', (data) => {
      console.log('[useTurnFlow] card_played received:', data);
      setFieldCards(data.fieldCards);
    });

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
      socket.off('game_start');
      socket.off('card_played');
      socket.off('turn_update');
    };
  }, [socket]);

  return {
    turnIndex,
    currentMultiplier,
    fieldCards,
  };
}