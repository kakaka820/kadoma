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






  useEffect(() => {
    if (!socket || !isConnected) return;
    if (hasAttemptedRejoin.current) return;

    const savedRoomId = localStorage.getItem('kadoma_active_room');
    const userIdToUse = userId || localStorage.getItem('kadoma_user_id');
    
    if (!savedRoomId || !userIdToUse) {
      console.log('[useRejoinGame] rejoin 条件未達成:');
        hasAttemptedRejoin.current = true;
      return;
    }
    console.log('[useRejoinGame] 保存された roomId を発見:', savedRoomId);
    console.log('[useRejoinGame] userId:', userIdToUse);
    
    hasAttemptedRejoin.current = true;

    //rejoin
    setTimeout(() => {
      console.log('[useRejoinGame] Emitting rejoin_game (single attempt)');
      socket.emit('rejoin_game', { 
        roomId: savedRoomId,
        userId: userIdToUse
      });
    }, 1500);
    //rejoin_failed を監視
    const handleRejoinFailed = (data: any) => {
      console.log('[useRejoinGame] rejoin_failed:', data.message);
      localStorage.removeItem('kadoma_active_room');
      // リトライはしない！
    };

    //rejoin_success で localStorage をクリア
    const handleRejoinSuccess = () => {
      console.log('[useRejoinGame] rejoin_success received');
    };
    socket.on('rejoin_failed', handleRejoinFailed);
    socket.on('rejoin_success', handleRejoinSuccess);
    return () => {
      socket.off('rejoin_failed', handleRejoinFailed);
      socket.off('rejoin_success', handleRejoinSuccess);
    };
  }, [socket, isConnected, userId]);
}