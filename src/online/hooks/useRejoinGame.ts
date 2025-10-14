// src/online/hooks/useRejoinGame.ts

import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface UseRejoinGameProps {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | undefined;
}

export function useRejoinGame({ socket, isConnected, userId }: UseRejoinGameProps) {
  useEffect(() => {
    if (!socket || !isConnected) return;

    const savedRoomId = localStorage.getItem('kadoma_active_room');
    const userIdToUse = userId || localStorage.getItem('kadoma_user_id');
    
    if (savedRoomId && userIdToUse ) {
      console.log('[useRejoinGame] 保存された roomId を発見:', savedRoomId);
      console.log('[useRejoinGame] userId:', userIdToUse);
      setTimeout(() => {
        socket.emit('rejoin_game', { 
          roomId: savedRoomId,
          userId: userIdToUse
        });
      }, 500);
    } else {
      console.log('[useRejoinGame] rejoin 条件未達成:', {
        savedRoomId,
        userId: userIdToUse
      });
    }
  }, [socket, isConnected, userId]);
}