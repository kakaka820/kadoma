// src/online/hooks/useDisconnectNotification.ts
// 切断・復帰の通知管理

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface DisconnectNotification {
  playerIndex: number;
  playerName: string;
  type: 'disconnected' | 'reconnected';
}

interface UseDisconnectNotificationProps {
  socket: Socket | null;
}

export function useDisconnectNotification({ socket }: UseDisconnectNotificationProps) {
  const [notification, setNotification] = useState<DisconnectNotification | null>(null);

  useEffect(() => {
    if (!socket) return;

    // プレイヤー切断通知
    socket.on('player_disconnected', (data) => {
      console.log('[Disconnect] Player disconnected:', data);
      setNotification({
        playerIndex: data.playerIndex,
        playerName: data.playerName,
        type: 'disconnected'
      });
      
      // 5秒後に通知を消す
      setTimeout(() => setNotification(null), 5000);
    });

    // プレイヤー復帰通知
    socket.on('player_reconnected', (data) => {
      console.log('[Disconnect] Player reconnected:', data);
      setNotification({
        playerIndex: data.playerIndex,
        playerName: data.playerName,
        type: 'reconnected'
      });
      
      // 3秒後に通知を消す
      setTimeout(() => setNotification(null), 3000);
    });

    return () => {
      socket.off('player_disconnected');
      socket.off('player_reconnected');
    };
  }, [socket]);

  return { notification };
}