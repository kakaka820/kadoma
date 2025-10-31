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

    //rejoin_success でタイマー復元
    socket.on('rejoin_success', (data) => {
      console.log('[useTurnFlow] rejoin_success received:', data.gameState);
      setCurrentMultiplier(data.gameState.currentMultiplier || 1);
      setFieldCards(data.gameState.fieldCards || [null, null, null]);
      setPlayerSelections(data.gameState.playerSelections || [false, false, false]);
      setSetTurnIndex(data.gameState.setTurnIndex || 0);
//サーバーから受け取った残り時間を使う
      if (data.gameState.timeRemaining !== undefined) {
        setTimeRemaining(data.gameState.timeRemaining);
        console.log('[useTurnFlow] Timer restored:', data.gameState.timeRemaining);
      }
      if (data.gameState.timeLimit !== undefined) {
        setTimeLimit(data.gameState.timeLimit);
      }
    });


     

   //全員選択後の一斉開示
    socket.on('cards_revealed', (data) => {
      console.log('[useTurnFlow] cards_revealed received:', data);
      setFieldCards(data.fieldCards);
      setTimeRemaining(0); 
    });

    // ターン更新（選択状態、倍率、場札）
    socket.on('turn_update', (data) => {
      console.log('[useTurnFlow] turn_update received:', data);
      setCurrentMultiplier(data.currentMultiplier || 1);
      setPlayerSelections(data.playerSelections || [false, false, false]);
      if (data.setTurnIndex !== undefined) {setSetTurnIndex(data.setTurnIndex);}
    });

    //ラウンド結果後、2秒待って場札クリア
  socket.on('round_result', () => {
    console.log('[useTurnFlow] round_result received, will clear field cards in 2s');
    setTimeout(() => {
      setFieldCards([null, null, null]);
    }, 2000);
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
      socket.off('rejoin_success');
      socket.off('cards_revealed');
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