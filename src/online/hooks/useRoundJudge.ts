// src/online/hooks/useRoundJudge.ts
// round_resultイベントの処理とラウンド結果の状態管理

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface UseRoundJudgeProps {
  socket: Socket | null;
}

interface UseRoundJudgeReturn {
  roundResult: string | null;
  scores: number[];
  wins: number[];
}

export function useRoundJudge({ socket }: UseRoundJudgeProps): UseRoundJudgeReturn {
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [wins, setWins] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    if (!socket) return;

    console.log('[useRoundJudge] Setting up event listeners');

    // ✅ 初期スコア受信（ゲーム開始時）
    socket.on('game_start', (data) => {
      console.log('[useRoundJudge] game_start - 初期スコア:', data.scores);
      setScores(data.scores);
      setWins([0, 0, 0]);  // 初期化
    });

    //再接続時のスコア・勝利数復元
  socket.on('reconnect_success', (data) => {
    console.log('[useRoundJudge] reconnect_success - スコア復元:', data.gameState);
    setScores(data.gameState.scores);
    setWins(data.gameState.wins);
  });

    // ラウンド結果
    socket.on('round_result', (data) => {
      console.log('[useRoundJudge] round_result received:', data);
      setRoundResult(data.message);
      setScores(data.scores);
      setWins(data.wins);
      
      // 2秒後に結果クリア
      setTimeout(() => {
        setRoundResult(null);
      }, 2000);
    });

    //新ターン開始時のスコア更新（場代徴収後）
    socket.on('turn_update', (data) => {
      console.log('[useRoundJudge] turn_update - 場代徴収後スコア:', data.scores);
      setScores(data.scores);
    });

    // クリーンアップ
    return () => {
      console.log('[useRoundJudge] Cleaning up event listeners');
      socket.off('game_start');
      socket.off('reconnect_success');
      socket.off('round_result');
      socket.off('turn_update');
    };
  }, [socket]);

  return {
    roundResult,
    scores,
    wins,
  };
}