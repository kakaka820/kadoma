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
    if (!socket || !isConnected || !userId) return;

    const savedRoomId = localStorage.getItem('kadoma_active_room');
    
    if (savedRoomId) {
      console.log('[useRejoinGame] 保存された roomId を発見:', savedRoomId);
      socket.emit('rejoin_game', { 
        roomId: savedRoomId,
        userId 
      });
    }
  }, [socket, isConnected, userId]);
}