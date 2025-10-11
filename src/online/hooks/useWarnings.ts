// src/online/hooks/useWarnings.ts
// 警告メッセージ管理フック

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

export interface Warning {
  id: string;
  type: 'joker_dealt' | 'low_deck';
  message: string;
  timestamp: number;
}

interface UseWarningsProps {
  socket: Socket | null;
}

interface UseWarningsReturn {
  warnings: Warning[];
  removeWarning: (id: string) => void;
}

export function useWarnings({ socket }: UseWarningsProps): UseWarningsReturn {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleWarning = (data: { type: 'joker_dealt' | 'low_deck'; message: string }) => {
      const newWarning: Warning = {
        id: `${Date.now()}-${Math.random()}`,
        type: data.type,
        message: data.message,
        timestamp: Date.now(),
      };

      setWarnings(prev => [...prev, newWarning]);
      console.log('[useWarnings] 警告受信:', newWarning);

      // 5秒後に自動削除
      setTimeout(() => {
        setWarnings(prev => prev.filter(w => w.id !== newWarning.id));
      }, 5000);
    };

    socket.on('warning', handleWarning);

    return () => {
      socket.off('warning', handleWarning);
    };
  }, [socket]);

  const removeWarning = (id: string) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  };

  return {
    warnings,
    removeWarning,
  };
}
