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

    // クリーンアップ
    return () => {
      console.log('[useRoundJudge] Cleaning up event listeners');
      socket.off('round_result');
    };
  }, [socket]);

  return {
    roundResult,
    scores,
    wins,
  };
}