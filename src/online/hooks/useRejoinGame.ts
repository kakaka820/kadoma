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
    const roomStatus = localStorage.getItem('kadoma_active_room_status');
    const userIdToUse = userId || localStorage.getItem('kadoma_user_id');
    
    if (!savedRoomId || !userIdToUse) {
      console.log('[useRejoinGame] rejoin 条件未達成:');
        hasAttemptedRejoin.current = true;
      return;
    }
    console.log('[useRejoinGame] 保存された roomId を発見:', savedRoomId);
    console.log('[useRejoinGame] roomStatus:', roomStatus);
    console.log('[useRejoinGame] userId:', userIdToUse);
    
    hasAttemptedRejoin.current = true;

    //rejoin
    setTimeout(() => {
       if (roomStatus === 'waiting') {
      console.log('[useRejoinGame] Emitting rejoin_waiting_room');
      socket.emit('rejoin_waiting_room', { 
        roomId: savedRoomId,
        userId: userIdToUse
      });
    } else {
      console.log('[useRejoinGame] Emitting rejoin_game');
      socket.emit('rejoin_game', { 
        roomId: savedRoomId,
        userId: userIdToUse
      });
    }
  }, 1500);
    //rejoin_failed を監視
    const handleRejoinFailed = (data: any) => {
      console.log('[useRejoinGame] rejoin_failed:', data.message);
      localStorage.removeItem('kadoma_active_room');
      localStorage.removeItem('kadoma_active_room_status');
      // リトライはしない！
    };

    //rejoin_success で localStorage をクリア
    const handleRejoinSuccess = () => {
      console.log('[useRejoinGame] rejoin_success received');
    };

    //rejoin_waiting_success リスナー
  const handleRejoinWaitingSuccess = () => {
    console.log('[useRejoinGame] rejoin_waiting_success received');
  };

    socket.on('rejoin_failed', handleRejoinFailed);
    socket.on('rejoin_success', handleRejoinSuccess);
    socket.on('rejoin_waiting_success', handleRejoinWaitingSuccess);
    return () => {
      socket.off('rejoin_failed', handleRejoinFailed);
      socket.off('rejoin_success', handleRejoinSuccess);
      socket.off('rejoin_waiting_success', handleRejoinWaitingSuccess);
    };
  }, [socket, isConnected, userId]);
}