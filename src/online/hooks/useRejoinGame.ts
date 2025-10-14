// src/online/hooks/useRejoinGame.ts

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface UseRejoinGameProps {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | undefined;
}

export function useRejoinGame({ socket, isConnected, userId }: UseRejoinGameProps) {

  const hasAttemptedRejoin = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;






  useEffect(() => {
    if (!socket || !isConnected) return;
    if (hasAttemptedRejoin.current) return;

    const savedRoomId = localStorage.getItem('kadoma_active_room');
    const userIdToUse = userId || localStorage.getItem('kadoma_user_id');
    
    if (!savedRoomId || !userIdToUse) {
      console.log('[useRejoinGame] rejoin 条件未達成:', {
        savedRoomId,
        userId: userIdToUse
      });
      return;
    }
    console.log('[useRejoinGame] 保存された roomId を発見:', savedRoomId);
    console.log('[useRejoinGame] userId:', userIdToUse);
    
    hasAttemptedRejoin.current = true;

    //リトライ機能付き rejoin
    const attemptRejoin = (delayMs: number) => {
      setTimeout(() => {
        console.log(`[useRejoinGame] Emitting rejoin_game (attempt ${retryCount.current + 1}/${MAX_RETRIES})`);
        socket.emit('rejoin_game', { 
          roomId: savedRoomId,
          userId: userIdToUse
        });
      }, delayMs);
    };
    //rejoin_failed を監視してリトライ
    const handleRejoinFailed = (data: any) => {
      console.log('[useRejoinGame] rejoin_failed:', data);
      
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        console.log(`[useRejoinGame] Retrying in ${1000 * retryCount.current}ms...`);
        attemptRejoin(1000 * retryCount.current);
      } else {
        console.log('[useRejoinGame] Max retries reached, giving up');
        //最終的に失敗したら localStorage をクリア
        localStorage.removeItem('kadoma_active_room');
      }
    };

    //rejoin_success で localStorage をクリア
    const handleRejoinSuccess = () => {
      console.log('[useRejoinGame] rejoin_success received');
      // roomId は game_start で再保存される
    };
    socket.on('rejoin_failed', handleRejoinFailed);
    socket.on('rejoin_success', handleRejoinSuccess);
    //初回試行は 1500ms 待つ
    attemptRejoin(1500);
    return () => {
      socket.off('rejoin_failed', handleRejoinFailed);
      socket.off('rejoin_success', handleRejoinSuccess);
    };
  }, [socket, isConnected, userId]);
}