//とりあえず枠だけ先に作った
// オンライン用エントリーらしい
// onlinesrc/OnlineApp.tsx
import React, { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import OnlineRoom from './components/OnlineRoom';

export default function OnlineApp() {
  const [gameStarted, setGameStarted] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  const handleGameStart = (roomId: string) => {
    setRoomId(roomId);
    setGameStarted(true);
  };

  return (
    <SocketProvider>
      <div className="online-app min-h-screen bg-gray-50 p-4">
        {!gameStarted ? (
          <OnlineRoom onGameStart={handleGameStart} />
        ) : (
          <div>
            <h2>オンライン対戦中 (Room: {roomId})</h2>
            <p>ゲーム画面準備中...</p>
            {/* ← 後で OnlineGame.tsx 作る */}
          </div>
        )}
      </div>
    </SocketProvider>
  );
}
