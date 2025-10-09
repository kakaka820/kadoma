//WebSocketとの接続をフロント側で切っちゃう問題を解決するため

//onlinesrc/context/SocketContext.tsx



import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log('[SocketContext] 接続開始');
    const newSocket = io('https://kadoma.onrender.com',{
      reconnection: true,
      reconnectionAttempts:10,
      reconnectionDelay:3500,
      timeout:20000,
    });
    
    newSocket.on('connect', () => {
      console.log('[SocketContext] 接続成功:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('[SocketContext] 切断');
    });

    setSocket(newSocket);

    // アプリ終了時のみ切断
    return () => {
      console.log('[SocketContext] クリーンアップ');
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}


export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
