//WebSocketとの接続をフロント側で切っちゃう問題を解決するため

//onlinesrc/context/SocketContext.tsx



import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';


interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}


const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}




export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('[SocketContext] 接続開始');
    const newSocket = io('https://kadoma.onrender.com',{
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts:10,
      reconnectionDelay:3500,
      timeout:20000,
    });
    
    newSocket.on('connect', () => {
      console.log('[SocketContext] 接続成功:', newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
    });
   


    newSocket.on('disconnect', () => {
      console.log('[SocketContext] 切断');
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
    console.log('[SocketContext] 再接続成功:', attemptNumber);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[SocketContext] 再接続試行中:', attemptNumber);
    });

    newSocket.on('reconnect_failed', () => {
    console.error('[SocketContext] 再接続失敗');
    });


    // ✅ エラーハンドリング追加
    newSocket.on('connect_error', (error) => {
      console.error('[SocketContext] 接続エラー:', error);
      setIsConnected(false);
    });

    // ✅ rejoin_failed イベント（reconnect_failed じゃない！）
    newSocket.on('rejoin_failed', (data) => {
      console.log('[SocketContext] 復帰失敗:', data.message);
      localStorage.removeItem('kadoma_active_room');
      alert(`復帰できませんでした: ${data.message}`);
    });
    setSocket(newSocket);


     // アプリ終了時のみ切断
    return () => {
      console.log('[SocketContext] クリーンアップ');
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
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