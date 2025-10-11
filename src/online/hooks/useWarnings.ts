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
        id: `${data.type}-${Date.now()}`,
        type: data.type,
        message: data.message,
        timestamp: Date.now(),
      };

      setWarnings(prev => {
        // 同じタイプの警告があれば削除して新しいものを追加
        const filtered = prev.filter(w => w.type !== data.type);
        return [...filtered, newWarning];
      });
      
      console.log('[useWarnings] 警告受信:', newWarning);
    }; // ← handleWarningの終わり

    // ← handleClearWarningsはここから（handleWarningの外）
    const handleClearWarnings = () => {
      console.log('[useWarnings] 警告クリア');
      setWarnings([]);
    };

    socket.on('warning', handleWarning);
    socket.on('clear_warnings', handleClearWarnings);

    return () => {
      socket.off('warning', handleWarning);
      socket.off('clear_warnings', handleClearWarnings);
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